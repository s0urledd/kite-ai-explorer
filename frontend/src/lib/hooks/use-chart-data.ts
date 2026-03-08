"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { rpc, hex, type RpcBlock } from "@/lib/api/rpc";

export type TimeRange = "1H" | "24H" | "1W";

interface ChartPoint {
  t: string;
  v: number;
}

// Fewer data points, sampled over wider spans
const BLOCK_COUNTS: Record<TimeRange, number> = {
  "1H": 25,
  "24H": 40,
  "1W": 50,
};

// Steps between sampled blocks (assuming ~2s block time)
// 24H ≈ 43200 blocks → step ~1080 to get 40 samples
// 1W  ≈ 302400 blocks → step ~6048 to get 50 samples
const SAMPLE_STEP: Record<TimeRange, number> = {
  "1H": 1,
  "24H": 1080,
  "1W": 6048,
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
  const lastRange = useRef<string>("");
  const lastBlock = useRef<number>(0);

  const load = useCallback(async () => {
    if (latestBlock <= 0) return;
    // Avoid refetching if range and block haven't changed significantly
    const key = `${range}-${Math.floor(latestBlock / 10)}`;
    if (key === lastRange.current) return;
    lastRange.current = key;

    setLoading(true);

    const count = BLOCK_COUNTS[range];
    const step = SAMPLE_STEP[range];
    const fmt = TIME_FORMAT[range];

    const blockNums: number[] = [];
    for (let i = 0; i < count; i++) {
      const num = latestBlock - i * step;
      if (num >= 0) blockNums.push(num);
    }

    // Fetch all blocks in parallel - use false (no tx details) for speed
    const results = await Promise.all(
      blockNums.map((n) =>
        rpc<RpcBlock>("eth_getBlockByNumber", ["0x" + n.toString(16), false]).catch(() => null)
      )
    );

    const blocks = results.filter(Boolean) as RpcBlock[];

    const txPoints: ChartPoint[] = [];
    const gasPoints: ChartPoint[] = [];

    blocks.forEach((b) => {
      // When fetched with false, transactions is array of hashes
      const tc = Array.isArray(b.transactions) ? b.transactions.length : 0;
      const ts = hex(b.timestamp);
      const label = new Date(ts * 1000).toLocaleTimeString([], fmt);
      const gu = hex(b.gasUsed);
      const gl = hex(b.gasLimit);

      txPoints.unshift({ t: label, v: tc });
      gasPoints.unshift({ t: label, v: gl > 0 ? parseFloat(((gu / gl) * 100).toFixed(1)) : 0 });
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
