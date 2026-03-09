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
  transactionsToday: number;
  gasUsedToday: number;
  totalBlocks: number;
  // Blockscout real stats
  chainStats: ChainStats | null;
  // Network activity counters
  totalContracts: number;
  newAddresses24h: number;
  newContracts24h: number;
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
  transactionsToday: 0,
  gasUsedToday: 0,
  totalBlocks: 0,
  chainStats: null,
  totalContracts: 0,
  newAddresses24h: 0,
  newContracts24h: 0,
};

export function useChainData(pollInterval = 10000) {
  const [data, setData] = useState<ChainData>(INITIAL);
  const addrs = useRef(new Set<string>());
  // Cache total contracts count — refresh every 60s, not every 10s
  const contractCountCache = useRef({ value: 0, lastFetch: 0 });

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
    let contractCreations = 0;
    const contractMap: Record<string, { address: string; count: number; users: Set<string> }> = {};
    const txH: { t: string; v: number }[] = [];
    const gasH: { t: string; v: number }[] = [];
    const sampleAddrs = new Set<string>();

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
        sampleAddrs.add(tx.from);
        if (tx.to) {
          addrs.current.add(tx.to);
          sampleAddrs.add(tx.to);
        }

        // Contract creation: tx.to is null
        if (!tx.to) {
          contractCreations++;
        }

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

    // TPS: calculate from total txns / total time span (more stable than per-block avg)
    const totalTimeSpan =
      bks.length >= 2
        ? hex(bks[0].timestamp) - hex(bks[bks.length - 1].timestamp)
        : 0;
    const avgTps = totalTimeSpan > 0 ? tot / totalTimeSpan : 0;

    // Peak TPS: use 3-block rolling window to smooth out noise
    let peakTps = 0;
    for (let i = 0; i < bks.length - 3; i++) {
      const windowTime = hex(bks[i].timestamp) - hex(bks[i + 3].timestamp);
      if (windowTime <= 0) continue;
      let windowTx = 0;
      for (let j = i; j < i + 3; j++) {
        windowTx += ((bks[j].transactions as RpcTransaction[])?.length || 0);
      }
      const windowTps = windowTx / windowTime;
      if (windowTps > peakTps) peakTps = windowTps;
    }

    // Total TXN: prefer Blockscout stats; fallback estimates from block number & avg tx/block
    let totalTx: number;
    if (stats?.total_transactions) {
      totalTx = parseInt(stats.total_transactions);
    } else {
      const avgTxPerBlock = bks.length > 0 ? tot / bks.length : 0;
      totalTx = Math.round(avgTxPerBlock * bn);
    }

    // ── Extrapolate 24H metrics from our 25-block sample ──
    // Sample duration in seconds
    const sampleDuration =
      bks.length >= 2
        ? hex(bks[0].timestamp) - hex(bks[bks.length - 1].timestamp)
        : 0;
    const DAY_SECONDS = 86400;
    const scaleFactor = sampleDuration > 0 ? DAY_SECONDS / sampleDuration : 0;

    // New wallets (24H): unique addresses in sample × scale factor
    // This is an estimate — unique addresses seen in our block window, projected to 24H
    const newAddresses24h = scaleFactor > 0
      ? Math.round(sampleAddrs.size * scaleFactor)
      : 0;

    // New contracts (24H): contract creation txns in sample × scale factor
    const newContracts24h = scaleFactor > 0
      ? Math.round(contractCreations * scaleFactor)
      : contractCreations;

    // ── Total contracts: fetch from Blockscout (cached, refresh every 60s) ──
    const now = Date.now();
    if (now - contractCountCache.current.lastFetch > 60000) {
      const count = await blockscout.countAllSmartContracts();
      if (count > 0) {
        contractCountCache.current = { value: count, lastFetch: now };
      }
    }
    const totalContracts = contractCountCache.current.value;

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
      transactionsToday: stats ? parseInt(stats.transactions_today || "0") : 0,
      gasUsedToday: stats ? parseInt(stats.gas_used_today || "0") : 0,
      totalBlocks: stats ? parseInt(stats.total_blocks || "0") : bn,
      chainStats: stats,
      totalContracts,
      newAddresses24h,
      newContracts24h,
    });
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, pollInterval);
    return () => clearInterval(iv);
  }, [load, pollInterval]);

  return data;
}
