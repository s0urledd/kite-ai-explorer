"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { rpc, hex, type RpcBlock } from "@/lib/api/rpc";
import { blockscout } from "@/lib/api/blockscout";

export type TimeRange = "1H" | "24H" | "1W";

interface ChartPoint {
  t: string;
  v: number;
}

// For 1H: fetch recent blocks and aggregate into ~5min windows
const HOUR_BLOCKS = 1800; // ~1h worth of blocks at 2s/block
const HOUR_WINDOW_SIZE = 150; // ~5 min window (150 blocks × 2s)
const HOUR_WINDOWS = 12; // 12 windows = 60 min

export function useChartData(latestBlock: number, range: TimeRange) {
  const [txData, setTxData] = useState<ChartPoint[]>([]);
  const [gasData, setGasData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const lastKey = useRef<string>("");

  const load = useCallback(async () => {
    if (latestBlock <= 0) return;
    const key = `${range}-${Math.floor(latestBlock / 10)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    setLoading(true);

    try {
      if (range === "1H") {
        await loadHourData(latestBlock, setTxData, setGasData);
      } else {
        // Try Blockscout aggregated chart data first
        const used = await loadBlockscoutChartData(range, setTxData, setGasData);
        if (!used) {
          // Fallback: sample blocks but aggregate into windows
          await loadSampledData(latestBlock, range, setTxData, setGasData);
        }
      }
    } catch {
      // Silent fail - keep previous data
    }

    setLoading(false);
  }, [latestBlock, range]);

  useEffect(() => {
    load();
  }, [load]);

  return { txData, gasData, loading };
}

/**
 * 1H view: Fetch blocks and aggregate into 5-minute windows
 * Instead of showing tx per individual block, shows total txs per window
 */
async function loadHourData(
  latestBlock: number,
  setTx: (d: ChartPoint[]) => void,
  setGas: (d: ChartPoint[]) => void,
) {
  // Sample one block per window boundary to get timestamps, plus count txs
  // Fetch boundary blocks + a few samples per window for accuracy
  const windowBoundaries: number[] = [];
  for (let i = 0; i < HOUR_WINDOWS; i++) {
    const startBlock = latestBlock - (HOUR_WINDOWS - i) * HOUR_WINDOW_SIZE;
    if (startBlock >= 0) windowBoundaries.push(startBlock);
  }

  // Fetch boundary blocks for timestamps
  const boundaryResults = await Promise.all(
    windowBoundaries.map((n) =>
      rpc<RpcBlock>("eth_getBlockByNumber", ["0x" + n.toString(16), false]).catch(() => null)
    )
  );

  // For each window, sample a few blocks to estimate tx count
  const SAMPLES_PER_WINDOW = 10;
  const txPoints: ChartPoint[] = [];
  const gasPoints: ChartPoint[] = [];

  for (let w = 0; w < windowBoundaries.length; w++) {
    const windowStart = windowBoundaries[w];
    const windowEnd = windowStart + HOUR_WINDOW_SIZE;
    const boundary = boundaryResults[w];
    if (!boundary) continue;

    // Sample evenly spaced blocks within window
    const sampleStep = Math.max(1, Math.floor(HOUR_WINDOW_SIZE / SAMPLES_PER_WINDOW));
    const sampleNums: number[] = [];
    for (let s = 0; s < SAMPLES_PER_WINDOW; s++) {
      const num = windowStart + s * sampleStep;
      if (num <= windowEnd && num <= latestBlock) sampleNums.push(num);
    }

    const samples = await Promise.all(
      sampleNums.map((n) =>
        rpc<RpcBlock>("eth_getBlockByNumber", ["0x" + n.toString(16), false]).catch(() => null)
      )
    );

    const validSamples = samples.filter(Boolean) as RpcBlock[];
    if (validSamples.length === 0) continue;

    // Estimate total txs in window: (avg tx per sampled block) × window size
    const totalSampledTx = validSamples.reduce(
      (sum, b) => sum + (Array.isArray(b.transactions) ? b.transactions.length : 0),
      0
    );
    const estimatedWindowTx = Math.round(
      (totalSampledTx / validSamples.length) * HOUR_WINDOW_SIZE
    );

    // Gas: average gas utilization across samples
    const gasUtils = validSamples.map((b) => {
      const gu = hex(b.gasUsed);
      const gl = hex(b.gasLimit);
      return gl > 0 ? (gu / gl) * 100 : 0;
    });
    const avgGas = gasUtils.reduce((a, b) => a + b, 0) / gasUtils.length;

    const ts = hex(boundary.timestamp);
    const label = new Date(ts * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    txPoints.push({ t: label, v: estimatedWindowTx });
    gasPoints.push({ t: label, v: parseFloat(avgGas.toFixed(1)) });
  }

  setTx(txPoints);
  setGas(gasPoints);
}

/**
 * Use Blockscout's /stats/charts/transactions for 24H/1W
 * Returns daily aggregated tx counts - much more accurate
 */
async function loadBlockscoutChartData(
  range: TimeRange,
  setTx: (d: ChartPoint[]) => void,
  setGas: (d: ChartPoint[]) => void,
): Promise<boolean> {
  try {
    const chartData = await blockscout.getTransactionCharts();
    if (!chartData?.chart_data?.length) return false;

    const days = range === "24H" ? 1 : 7;
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filtered = chartData.chart_data.filter((d) => new Date(d.date) >= cutoff);

    if (filtered.length === 0) return false;

    const fmt: Intl.DateTimeFormatOptions =
      range === "24H"
        ? { hour: "2-digit", minute: "2-digit" }
        : { month: "short", day: "numeric" };

    const txPoints = filtered.map((d) => ({
      t: new Date(d.date).toLocaleDateString([], fmt),
      v: d.tx_count,
    }));

    setTx(txPoints);

    // Gas data not available from this endpoint - leave empty or use fallback
    // We'll set gas to empty; the gas chart hook can handle this separately
    setGas([]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fallback: sample blocks but aggregate into time windows
 * Instead of showing per-block tx, groups blocks into windows and sums txs
 */
async function loadSampledData(
  latestBlock: number,
  range: TimeRange,
  setTx: (d: ChartPoint[]) => void,
  setGas: (d: ChartPoint[]) => void,
) {
  // Config: how many windows and blocks per range
  const config: Record<string, { windows: number; blocksPerWindow: number }> = {
    "24H": { windows: 24, blocksPerWindow: 1800 }, // 24 hourly windows, 1800 blocks/hr
    "1W": { windows: 28, blocksPerWindow: 10800 }, // 28 windows (~6hr each), 10800 blocks/window
  };

  const { windows, blocksPerWindow } = config[range] || config["24H"];
  const SAMPLES_PER_WINDOW = 5;

  const txPoints: ChartPoint[] = [];
  const gasPoints: ChartPoint[] = [];

  const fmt: Intl.DateTimeFormatOptions =
    range === "24H"
      ? { hour: "2-digit", minute: "2-digit" }
      : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };

  // Fetch all samples in parallel
  const allSampleNums: { window: number; blockNum: number }[] = [];
  for (let w = 0; w < windows; w++) {
    const windowStart = latestBlock - (windows - w) * blocksPerWindow;
    const sampleStep = Math.max(1, Math.floor(blocksPerWindow / SAMPLES_PER_WINDOW));
    for (let s = 0; s < SAMPLES_PER_WINDOW; s++) {
      const num = windowStart + s * sampleStep;
      if (num >= 0 && num <= latestBlock) {
        allSampleNums.push({ window: w, blockNum: num });
      }
    }
  }

  const allResults = await Promise.all(
    allSampleNums.map((s) =>
      rpc<RpcBlock>("eth_getBlockByNumber", ["0x" + s.blockNum.toString(16), false]).catch(() => null)
    )
  );

  // Group results by window
  const windowMap: Record<number, RpcBlock[]> = {};
  allSampleNums.forEach((s, i) => {
    const block = allResults[i];
    if (block) {
      if (!windowMap[s.window]) windowMap[s.window] = [];
      windowMap[s.window].push(block);
    }
  });

  for (let w = 0; w < windows; w++) {
    const blocks = windowMap[w];
    if (!blocks || blocks.length === 0) continue;

    const totalSampledTx = blocks.reduce(
      (sum, b) => sum + (Array.isArray(b.transactions) ? b.transactions.length : 0),
      0
    );
    const estimatedWindowTx = Math.round(
      (totalSampledTx / blocks.length) * blocksPerWindow
    );

    const gasUtils = blocks.map((b) => {
      const gu = hex(b.gasUsed);
      const gl = hex(b.gasLimit);
      return gl > 0 ? (gu / gl) * 100 : 0;
    });
    const avgGas = gasUtils.reduce((a, b) => a + b, 0) / gasUtils.length;

    const ts = hex(blocks[0].timestamp);
    const label = new Date(ts * 1000).toLocaleDateString([], fmt);

    txPoints.push({ t: label, v: estimatedWindowTx });
    gasPoints.push({ t: label, v: parseFloat(avgGas.toFixed(1)) });
  }

  setTx(txPoints);
  setGas(gasPoints);
}
