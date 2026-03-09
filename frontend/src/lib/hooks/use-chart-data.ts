"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { rpc, hex, type RpcBlock } from "@/lib/api/rpc";
import { blockscout } from "@/lib/api/blockscout";

export type TimeRange = "24H" | "1W" | "1M";

interface ChartPoint {
  t: string;
  v: number;
}

// Block time ~2s on KiteAI
const BLOCK_TIME = 2;

// Window configs for each range
const RANGE_CONFIG: Record<TimeRange, { windows: number; secondsPerWindow: number; label: Intl.DateTimeFormatOptions }> = {
  "24H": {
    windows: 24,
    secondsPerWindow: 3600, // 1 hour
    label: { hour: "2-digit", minute: "2-digit" },
  },
  "1W": {
    windows: 14,
    secondsPerWindow: 43200, // 12 hours
    label: { month: "short", day: "numeric" },
  },
  "1M": {
    windows: 30,
    secondsPerWindow: 86400, // 1 day
    label: { month: "short", day: "numeric" },
  },
};

const SAMPLES_PER_WINDOW = 3;

export function useChartData(latestBlock: number, range: TimeRange) {
  const [txData, setTxData] = useState<ChartPoint[]>([]);
  const [gasData, setGasData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const lastKey = useRef("");

  const load = useCallback(async () => {
    if (latestBlock <= 0) return;

    // Debounce: only re-fetch when block changes significantly
    const key = `${range}-${Math.floor(latestBlock / 50)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    setLoading(true);

    try {
      const config = RANGE_CONFIG[range];
      const blocksPerWindow = Math.round(config.secondsPerWindow / BLOCK_TIME);
      const totalBlocksNeeded = config.windows * blocksPerWindow;

      // If chain is younger than requested range, adjust window count
      const actualWindows = Math.min(
        config.windows,
        Math.max(1, Math.floor(latestBlock / blocksPerWindow))
      );

      // Try Blockscout chart data for TX (1W/1M get better data from daily aggregation)
      let blockscoutTxData: ChartPoint[] | null = null;
      if (range !== "24H") {
        blockscoutTxData = await loadBlockscoutTxData(range);
      }

      // Always load gas data from RPC sampling (Blockscout doesn't provide gas charts)
      // Also load tx data from RPC if Blockscout failed
      const rpcData = await loadRpcSampledData(
        latestBlock,
        actualWindows,
        blocksPerWindow,
        config.label,
      );

      setTxData(blockscoutTxData && blockscoutTxData.length > 2 ? blockscoutTxData : rpcData.tx);
      setGasData(rpcData.gas);
    } catch {
      // Keep previous data on error
    }

    setLoading(false);
  }, [latestBlock, range]);

  useEffect(() => {
    load();
  }, [load]);

  return { txData, gasData, loading };
}

/**
 * Try Blockscout /stats/charts/transactions for tx data.
 * Returns daily aggregated tx counts - accurate for 1W/1M.
 */
async function loadBlockscoutTxData(range: TimeRange): Promise<ChartPoint[] | null> {
  try {
    const chartData = await blockscout.getTransactionCharts();
    if (!chartData?.chart_data?.length) return null;

    const days = range === "1W" ? 7 : 30;
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filtered = chartData.chart_data
      .filter((d) => new Date(d.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (filtered.length < 2) return null;

    return filtered.map((d) => ({
      t: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      v: d.tx_count,
    }));
  } catch {
    return null;
  }
}

/**
 * RPC sampling: fetch a few blocks per time window, extrapolate tx count & avg gas.
 * Works for all ranges and always provides both tx and gas data.
 */
async function loadRpcSampledData(
  latestBlock: number,
  windows: number,
  blocksPerWindow: number,
  labelFmt: Intl.DateTimeFormatOptions,
): Promise<{ tx: ChartPoint[]; gas: ChartPoint[] }> {
  // Build sample list: for each window, pick SAMPLES_PER_WINDOW evenly spaced blocks
  const samples: { window: number; blockNum: number }[] = [];

  for (let w = 0; w < windows; w++) {
    const windowStart = latestBlock - (windows - w) * blocksPerWindow;
    if (windowStart < 0) continue;

    const step = Math.max(1, Math.floor(blocksPerWindow / SAMPLES_PER_WINDOW));
    for (let s = 0; s < SAMPLES_PER_WINDOW; s++) {
      const num = windowStart + s * step;
      if (num >= 0 && num <= latestBlock) {
        samples.push({ window: w, blockNum: num });
      }
    }
  }

  // Fetch all sampled blocks in parallel (batched to avoid overwhelming RPC)
  const BATCH_SIZE = 30;
  const results: (RpcBlock | null)[] = new Array(samples.length).fill(null);

  for (let i = 0; i < samples.length; i += BATCH_SIZE) {
    const batch = samples.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((s) =>
        rpc<RpcBlock>("eth_getBlockByNumber", ["0x" + s.blockNum.toString(16), false]).catch(() => null)
      )
    );
    batchResults.forEach((r, j) => {
      results[i + j] = r;
    });
  }

  // Group by window
  const windowBlocks: Record<number, RpcBlock[]> = {};
  samples.forEach((s, i) => {
    const block = results[i];
    if (block) {
      if (!windowBlocks[s.window]) windowBlocks[s.window] = [];
      windowBlocks[s.window].push(block);
    }
  });

  // Build chart points
  const txPoints: ChartPoint[] = [];
  const gasPoints: ChartPoint[] = [];

  for (let w = 0; w < windows; w++) {
    const blocks = windowBlocks[w];
    if (!blocks || blocks.length === 0) continue;

    // TX: estimate total txs in window
    const sampledTx = blocks.reduce(
      (sum, b) => sum + (Array.isArray(b.transactions) ? b.transactions.length : 0),
      0
    );
    const estimatedTx = Math.round((sampledTx / blocks.length) * blocksPerWindow);

    // Gas: average utilization across samples
    const gasUtils = blocks.map((b) => {
      const gu = hex(b.gasUsed);
      const gl = hex(b.gasLimit);
      return gl > 0 ? (gu / gl) * 100 : 0;
    });
    const avgGas = gasUtils.reduce((a, b) => a + b, 0) / gasUtils.length;

    // Label from first block's timestamp
    const ts = hex(blocks[0].timestamp);
    const label = new Date(ts * 1000).toLocaleDateString("en-US", labelFmt);

    txPoints.push({ t: label, v: estimatedTx });
    gasPoints.push({ t: label, v: parseFloat(avgGas.toFixed(1)) });
  }

  return { tx: txPoints, gas: gasPoints };
}
