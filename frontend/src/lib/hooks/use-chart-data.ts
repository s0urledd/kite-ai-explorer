"use client";

import { useState, useEffect, useCallback } from "react";
import { rpc, hex, type RpcBlock, type RpcTransaction } from "@/lib/api/rpc";

export type TimeRange = "1H" | "24H" | "1W";

interface ChartPoint {
  t: string;
  v: number;
}

// Approximate block counts per range (assuming ~2s block time)
const BLOCK_COUNTS: Record<TimeRange, number> = {
  "1H": 25,    // ~25 blocks for last hour view
  "24H": 200,  // sample ~200 blocks spread over 24h
  "1W": 500,   // sample ~500 blocks spread over 1 week
};

// How many blocks to skip between samples for wider ranges
const SAMPLE_STEP: Record<TimeRange, number> = {
  "1H": 1,
  "24H": 6,    // every 6th block
  "1W": 20,    // every 20th block
};

const TIME_FORMAT: Record<TimeRange, Intl.DateTimeFormatOptions> = {
  "1H": { hour: "2-digit", minute: "2-digit" },
  "24H": { hour: "2-digit", minute: "2-digit" },
  "1W": { month: "short", day: "numeric" },
};

export function useChartData(latestBlock: number, range: TimeRange) {
  const [txData, setTxData] = useState<ChartPoint[]>([]);
  const [gasData, setGasData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (latestBlock <= 0) return;
    setLoading(true);

    const count = BLOCK_COUNTS[range];
    const step = SAMPLE_STEP[range];
    const fmt = TIME_FORMAT[range];

    const blockNums: number[] = [];
    for (let i = 0; i < count; i++) {
      const num = latestBlock - i * step;
      if (num >= 0) blockNums.push(num);
    }

    // Fetch blocks in batches of 25 to avoid overloading
    const batchSize = 25;
    const allBlocks: (RpcBlock | null)[] = [];
    for (let i = 0; i < blockNums.length; i += batchSize) {
      const batch = blockNums.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((n) => rpc<RpcBlock>("eth_getBlockByNumber", ["0x" + n.toString(16), true]).catch(() => null))
      );
      allBlocks.push(...results);
    }

    const blocks = allBlocks.filter(Boolean) as RpcBlock[];

    const txPoints: ChartPoint[] = [];
    const gasPoints: ChartPoint[] = [];

    blocks.forEach((b) => {
      const txs = (b.transactions || []) as RpcTransaction[];
      const ts = hex(b.timestamp);
      const label = new Date(ts * 1000).toLocaleTimeString([], fmt);
      const gu = hex(b.gasUsed);
      const gl = hex(b.gasLimit);

      txPoints.unshift({ t: label, v: txs.length });
      gasPoints.unshift({ t: label, v: parseFloat(((gu / gl) * 100).toFixed(1)) });
    });

    setTxData(txPoints);
    setGasData(gasPoints);
    setLoading(false);
  }, [latestBlock, range]);

  useEffect(() => {
    load();
  }, [load]);

  return { txData, gasData, loading };
}
