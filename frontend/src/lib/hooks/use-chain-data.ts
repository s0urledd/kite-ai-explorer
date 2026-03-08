"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { rpc, hex, gwei, type RpcBlock, type RpcTransaction } from "@/lib/api/rpc";
import { blockscout } from "@/lib/api/blockscout";
import type { ChainStats } from "@/lib/types/api";

export interface ChainData {
  blockNumber: number;
  gasPrice: number;
  blocks: RpcBlock[];
  txHistory: { t: string; v: number }[];
  gasHistory: { t: string; v: number }[];
  totalTx: number;
  avgBlockTime: number;
  utilization: number;
  tps: number;
  peakTps: number;
  contracts: { address: string; calls: number; callers: number }[];
  addressCount: number;
  // Blockscout real stats
  chainStats: ChainStats | null;
}

const INITIAL: ChainData = {
  blockNumber: 0,
  gasPrice: 0,
  blocks: [],
  txHistory: [],
  gasHistory: [],
  totalTx: 0,
  avgBlockTime: 0,
  utilization: 0,
  tps: 0,
  peakTps: 0,
  contracts: [],
  addressCount: 0,
  chainStats: null,
};

export function useChainData(pollInterval = 10000) {
  const [data, setData] = useState<ChainData>(INITIAL);
  const addrs = useRef(new Set<string>());

  const load = useCallback(async () => {
    // Fetch RPC data and Blockscout stats in parallel
    const [bnH, gpH, stats] = await Promise.all([
      rpc<string>("eth_blockNumber"),
      rpc<string>("eth_gasPrice"),
      blockscout.getStats().catch(() => null),
    ]);
    const bn = hex(bnH);
    const gp = gwei(gpH);

    const promises: Promise<RpcBlock | null>[] = [];
    for (let i = 0; i < 25; i++) {
      promises.push(rpc<RpcBlock>("eth_getBlockByNumber", ["0x" + (bn - i).toString(16), true]));
    }
    const bks = (await Promise.all(promises)).filter(Boolean) as RpcBlock[];

    let tot = 0;
    const contractMap: Record<string, { address: string; count: number; users: Set<string> }> = {};
    const txH: { t: string; v: number }[] = [];
    const gasH: { t: string; v: number }[] = [];

    bks.forEach((b) => {
      const txs = (b.transactions || []) as RpcTransaction[];
      const tc = txs.length;
      tot += tc;

      const ts = hex(b.timestamp);
      const label = new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      txH.unshift({ t: label, v: tc });

      const gu = hex(b.gasUsed);
      const gl = hex(b.gasLimit);
      gasH.unshift({ t: label, v: parseFloat(((gu / gl) * 100).toFixed(1)) });

      txs.forEach((tx) => {
        addrs.current.add(tx.from);
        if (tx.to) addrs.current.add(tx.to);
        if (tx.to && tx.input?.length > 10) {
          if (!contractMap[tx.to]) contractMap[tx.to] = { address: tx.to, count: 0, users: new Set() };
          contractMap[tx.to].count++;
          contractMap[tx.to].users.add(tx.from);
        }
      });
    });

    const contracts = Object.values(contractMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((c) => ({ address: c.address, calls: c.count, callers: c.users.size }));

    const avgBt =
      bks.length >= 2
        ? (hex(bks[0].timestamp) - hex(bks[bks.length - 1].timestamp)) / (bks.length - 1)
        : 0;

    const util = bks[0] ? (hex(bks[0].gasUsed) / hex(bks[0].gasLimit)) * 100 : 0;

    // TPS: use all fetched blocks for better accuracy
    const tpsValues: number[] = [];
    for (let i = 0; i < bks.length - 1; i++) {
      const dt = hex(bks[i].timestamp) - hex(bks[i + 1].timestamp);
      const txCount = ((bks[i].transactions as RpcTransaction[])?.length || 0);
      if (dt > 0) tpsValues.push(txCount / dt);
    }

    const avgTps = tpsValues.length > 0
      ? tpsValues.reduce((a, b) => a + b, 0) / tpsValues.length
      : 0;
    const peakTps = tpsValues.length > 0 ? Math.max(...tpsValues) : 0;

    // Total TXN: prefer Blockscout stats; fallback estimates from block number & avg tx/block
    let totalTx: number;
    if (stats?.total_transactions) {
      totalTx = parseInt(stats.total_transactions);
    } else {
      // Better fallback: estimate from average txs/block across our sample × total blocks
      const avgTxPerBlock = bks.length > 0 ? tot / bks.length : 0;
      totalTx = Math.round(avgTxPerBlock * bn);
    }

    setData({
      blockNumber: bn,
      gasPrice: gp,
      blocks: bks.slice(0, 8),
      txHistory: txH,
      gasHistory: gasH,
      totalTx,
      avgBlockTime: stats ? stats.average_block_time / 1000 : avgBt,
      utilization: stats ? stats.network_utilization_percentage : util,
      tps: avgTps,
      peakTps,
      contracts,
      addressCount: stats ? parseInt(stats.total_addresses || "0") : addrs.current.size,
      chainStats: stats,
    });
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, pollInterval);
    return () => clearInterval(iv);
  }, [load, pollInterval]);

  return data;
}
