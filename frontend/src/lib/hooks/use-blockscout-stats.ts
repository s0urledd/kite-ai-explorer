"use client";

import { useState, useEffect, useCallback } from "react";
import { BLOCKSCOUT_API_URL } from "@/lib/config/chain";

export interface BlockscoutStats {
  totalTransactions: string;
  transactions24h: string;
  totalAddresses: string;
  totalBlocks: string;
  averageBlockTime: number;
  networkUtilization: number;
  gasUsedToday: string;
  gasPrice: {
    slow: number | null;
    average: number | null;
    fast: number | null;
  };
  totalContracts: number;
  newContracts24h: number;
  newAddresses24h: number;
}

const INITIAL: BlockscoutStats = {
  totalTransactions: "0",
  transactions24h: "0",
  totalAddresses: "0",
  totalBlocks: "0",
  averageBlockTime: 0,
  networkUtilization: 0,
  gasUsedToday: "0",
  gasPrice: { slow: null, average: null, fast: null },
  totalContracts: 0,
  newContracts24h: 0,
  newAddresses24h: 0,
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Pick first non-zero numeric value from multiple possible keys */
function pickCounter(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const val = Number(obj[key]);
    if (!isNaN(val) && val > 0) return val;
  }
  return 0;
}

export function useBlockscoutStats(pollInterval = 15000) {
  const [stats, setStats] = useState<BlockscoutStats>(INITIAL);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const baseUrl = BLOCKSCOUT_API_URL.replace(/\/$/, "");

    // Fetch main stats and counters in parallel
    const [mainStats, counters] = await Promise.all([
      fetchJson<Record<string, unknown>>(`${baseUrl}/stats`),
      fetchJson<Record<string, unknown>>(`${baseUrl}/stats/counters`),
    ]);

    if (!mainStats) return;

    // Parse main stats - these are reliable from /stats endpoint
    const totalTransactions = String(mainStats.total_transactions ?? "0");
    const transactions24h = String(mainStats.transactions_today ?? "0");
    const totalAddresses = String(mainStats.total_addresses ?? "0");
    const totalBlocks = String(mainStats.total_blocks ?? "0");
    const averageBlockTime = Number(mainStats.average_block_time ?? 0);
    const networkUtilization = Number(mainStats.network_utilization_percentage ?? 0);
    const gasUsedToday = String(mainStats.gas_used_today ?? "0");

    const gasPrices = mainStats.gas_prices as
      | { slow: number | null; average: number | null; fast: number | null }
      | undefined;

    // Parse counters - field names vary across Blockscout versions
    let totalContracts = 0;
    let newContracts24h = 0;
    let newAddresses24h = 0;

    if (counters) {
      totalContracts = pickCounter(
        counters,
        "smart_contracts_counter",
        "verified_smart_contracts_counter",
        "total_smart_contracts",
        "total_verified_contracts"
      );

      newContracts24h = pickCounter(
        counters,
        "new_smart_contracts_counter_24h",
        "new_verified_smart_contracts_counter_24h",
        "new_contracts_24h"
      );

      newAddresses24h = pickCounter(
        counters,
        "new_addresses_counter_24h",
        "new_addresses_24h",
        "addresses_today"
      );
    }

    setStats({
      totalTransactions,
      transactions24h,
      totalAddresses,
      totalBlocks,
      averageBlockTime,
      networkUtilization,
      gasUsedToday,
      gasPrice: gasPrices ?? { slow: null, average: null, fast: null },
      totalContracts,
      newContracts24h,
      newAddresses24h,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, pollInterval);
    return () => clearInterval(iv);
  }, [load, pollInterval]);

  return { stats, loading };
}
