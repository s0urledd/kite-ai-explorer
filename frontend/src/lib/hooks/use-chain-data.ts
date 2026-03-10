"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { rpc, hex, gwei, type RpcBlock, type RpcTransaction } from "@/lib/api/rpc";
import { blockscout } from "@/lib/api/blockscout";
import { STATS_API_URL } from "@/lib/config/chain";
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

/**
 * Fetch the latest value from a stats-microservice line chart.
 * Returns the most recent day's value, or 0 on failure.
 */
async function fetchLatestStatValue(endpoint: string): Promise<number> {
  try {
    const res = await fetch(`${STATS_API_URL}/api/v1/lines/${endpoint}`, {
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const chart = data?.chart;
    if (!Array.isArray(chart) || chart.length === 0) return 0;
    // Last entry = most recent day
    const last = chart[chart.length - 1];
    return parseInt(last.value) || 0;
  } catch {
    return 0;
  }
}

/**
 * Get a rolling 24H transaction count from multiple sources:
 * 1. Stats microservice daily chart (most accurate)
 * 2. Blockscout stats.transactions_today (fallback)
 */
async function fetch24hTransactions(stats: ChainStats | null): Promise<number> {
  // Source 1: Stats microservice — get last 2 days, weight by time of day for rolling 24H
  try {
    const res = await fetch(`${STATS_API_URL}/api/v1/lines/newTxns`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const chart = data?.chart;
      if (Array.isArray(chart) && chart.length >= 2) {
        // Get last 2 entries (today partial + yesterday full)
        const sorted = chart.sort(
          (a: { date: string }, b: { date: string }) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const today = sorted[sorted.length - 1];
        const yesterday = sorted[sorted.length - 2];
        const todayVal = parseInt(today.value) || 0;
        const yesterdayVal = parseInt(yesterday.value) || 0;

        // Calculate how far through today we are (UTC)
        const now = new Date();
        const hoursPassed = now.getUTCHours() + now.getUTCMinutes() / 60;
        const hoursRemaining = 24 - hoursPassed;

        // Rolling 24H ≈ today's partial count + proportional amount from yesterday
        if (hoursPassed > 0) {
          const rolling24h = todayVal + Math.round(yesterdayVal * (hoursRemaining / 24));
          if (rolling24h > 0) return rolling24h;
        }

        // Fallback: just use yesterday's full count
        if (yesterdayVal > 0) return yesterdayVal;
      }
    }
  } catch {
    // Fall through to next source
  }

  // Source 2: Blockscout stats.transactions_today
  if (stats?.transactions_today) {
    const val = parseInt(stats.transactions_today);
    if (val > 0) return val;
  }

  return 0;
}

export function useChainData(pollInterval = 10000) {
  const [data, setData] = useState<ChainData>(INITIAL);
  const addrs = useRef(new Set<string>());
  // Cache slow-changing values — refresh every 60s
  const slowCache = useRef({
    totalContracts: 0,
    newAddresses24h: 0,
    newContracts24h: 0,
    transactions24h: 0,
    lastFetch: 0,
  });

  const load = useCallback(async () => {
    // Fetch RPC data and Blockscout stats in parallel
    const [bnH, gpH, stats] = await Promise.all([
      rpc<string>("eth_blockNumber"),
      rpc<string>("eth_gasPrice"),
      blockscout.getStats().catch(() => null),
    ]);
    const bn = hex(bnH);
    const gp = gwei(gpH);

    // Fetch recent blocks for TPS, gas, active contracts, and display
    const RECENT_BLOCKS = 8;
    const promises: Promise<RpcBlock | null>[] = [];
    for (let i = 0; i < RECENT_BLOCKS; i++) {
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
        if (tx.to) {
          addrs.current.add(tx.to);
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

    // Block time from Blockscout (most accurate), fallback to local sample
    const localAvgBt =
      bks.length >= 2
        ? (hex(bks[0].timestamp) - hex(bks[bks.length - 1].timestamp)) / (bks.length - 1)
        : 0;

    const util = bks[0] ? (hex(bks[0].gasUsed) / hex(bks[0].gasLimit)) * 100 : 0;

    // TPS: instantaneous rate from recent blocks
    const totalTimeSpan =
      bks.length >= 2
        ? hex(bks[0].timestamp) - hex(bks[bks.length - 1].timestamp)
        : 0;
    const tps = totalTimeSpan > 0 ? tot / totalTimeSpan : 0;

    // Peak TPS: highest per-block rate
    let peakTps = 0;
    for (let i = 0; i < bks.length - 1; i++) {
      const blockTime = hex(bks[i].timestamp) - hex(bks[i + 1].timestamp);
      if (blockTime <= 0) continue;
      const blockTx = ((bks[i].transactions as RpcTransaction[])?.length || 0);
      const blockTps = blockTx / blockTime;
      if (blockTps > peakTps) peakTps = blockTps;
    }

    // Total TXN: prefer Blockscout stats
    let totalTx: number;
    if (stats?.total_transactions) {
      totalTx = parseInt(stats.total_transactions);
    } else {
      const avgTxPerBlock = bks.length > 0 ? tot / bks.length : 0;
      totalTx = Math.round(avgTxPerBlock * bn);
    }

    // ── Slow-changing counters: refresh every 60s ──
    const now = Date.now();
    if (now - slowCache.current.lastFetch > 60000) {
      const [tx24h, newAccounts, newContracts, contractCount] = await Promise.all([
        fetch24hTransactions(stats),
        fetchLatestStatValue("newAccounts"),
        fetchLatestStatValue("newContracts"),
        blockscout.countAllContracts(),
      ]);

      slowCache.current = {
        transactions24h: tx24h,
        newAddresses24h: newAccounts,
        newContracts24h: newContracts,
        totalContracts: contractCount > 0 ? contractCount : slowCache.current.totalContracts,
        lastFetch: now,
      };
    }

    // If slow cache still has 0 for 24h TX, use Blockscout stats directly
    const transactionsToday = slowCache.current.transactions24h > 0
      ? slowCache.current.transactions24h
      : (stats?.transactions_today ? parseInt(stats.transactions_today) : 0);

    setData({
      blockNumber: bn,
      gasPrice: gp,
      blocks: bks,
      txHistory: txH,
      gasHistory: gasH,
      totalTx,
      avgBlockTime: (stats?.average_block_time && stats.average_block_time > 0)
        ? stats.average_block_time / 1000
        : (localAvgBt > 0 ? localAvgBt : 2),
      utilization: stats ? stats.network_utilization_percentage : util,
      tps,
      peakTps,
      contracts,
      addressCount: stats ? parseInt(stats.total_addresses || "0") : addrs.current.size,
      transactionsToday,
      gasUsedToday: stats ? parseInt(stats.gas_used_today || "0") : 0,
      totalBlocks: stats ? parseInt(stats.total_blocks || "0") : bn,
      chainStats: stats,
      totalContracts: slowCache.current.totalContracts,
      newAddresses24h: slowCache.current.newAddresses24h,
      newContracts24h: slowCache.current.newContracts24h,
    });
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, pollInterval);
    return () => clearInterval(iv);
  }, [load, pollInterval]);

  return data;
}
