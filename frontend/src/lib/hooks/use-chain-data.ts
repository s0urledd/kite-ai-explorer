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

export function useChainData(pollInterval = 10000) {
  const [data, setData] = useState<ChainData>(INITIAL);
  const addrs = useRef(new Set<string>());
  // Track peak TPS over 24H — only goes up, resets after 24H
  const peakTpsRef = useRef({ value: 0, since: Date.now() });
  // Track new TX since last Blockscout update to keep 24H TX real-time
  const txTracker = useRef({ lastSeenBlock: 0, txDelta: 0, lastBlockscoutValue: 0 });
  // Cache slow-changing values — refresh every 60s
  const slowCache = useRef({
    totalContracts: 0,
    newAddresses24h: 0,
    newContracts24h: 0,
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
    const instantTps = totalTimeSpan > 0 ? tot / totalTimeSpan : 0;

    // Peak TPS: track highest instantaneous TPS seen, reset every 24H
    const now24h = Date.now();
    if (now24h - peakTpsRef.current.since > 86400_000) {
      peakTpsRef.current = { value: instantTps, since: now24h };
    } else if (instantTps > peakTpsRef.current.value) {
      peakTpsRef.current.value = instantTps;
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
      const [newAccounts, newContracts, contractCount] = await Promise.all([
        fetchLatestStatValue("newAccounts"),
        fetchLatestStatValue("newContracts"),
        blockscout.countAllContracts(),
      ]);

      slowCache.current = {
        newAddresses24h: newAccounts,
        newContracts24h: newContracts,
        totalContracts: contractCount > 0 ? contractCount : slowCache.current.totalContracts,
        lastFetch: now,
      };
    }

    // 24H TX: use Blockscout stats.transactions_today (fetched every 10s poll)
    // + count TX from new blocks between Blockscout updates for real-time feel
    const blockscoutTx24h = stats?.transactions_today ? parseInt(stats.transactions_today) : 0;

    if (blockscoutTx24h !== txTracker.current.lastBlockscoutValue && blockscoutTx24h > 0) {
      // Blockscout updated — use its value, reset delta
      txTracker.current = { lastSeenBlock: bn, txDelta: 0, lastBlockscoutValue: blockscoutTx24h };
    } else if (bn > txTracker.current.lastSeenBlock && bks.length > 0) {
      // New blocks arrived but Blockscout hasn't updated yet — count TX ourselves
      for (const b of bks) {
        const blockNum = hex(b.number);
        if (blockNum > txTracker.current.lastSeenBlock) {
          const txCount = Array.isArray(b.transactions) ? b.transactions.length : 0;
          txTracker.current.txDelta += txCount;
        }
      }
      txTracker.current.lastSeenBlock = bn;
    }

    const transactionsToday = (blockscoutTx24h > 0 ? blockscoutTx24h : 0) + txTracker.current.txDelta;

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
      // Avg TPS: 24H transaction count / seconds in a day
      tps: transactionsToday > 0 ? transactionsToday / 86400 : instantTps,
      // Peak TPS: highest instantaneous TPS observed in the last 24H
      peakTps: peakTpsRef.current.value,
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
