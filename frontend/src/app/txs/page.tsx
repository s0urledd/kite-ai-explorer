"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { blockscout } from "@/lib/api/blockscout";
import type { Transaction, PaginatedResponse } from "@/lib/types/api";
import { shortenHash, txStatusLabel, txStatusColor } from "@/lib/utils/format";

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [nextParams, setNextParams] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const data: PaginatedResponse<Transaction> = await blockscout.getTransactions(params);
      if (params) {
        setTxs((prev) => [...prev, ...data.items]);
      } else {
        setTxs(data.items);
      }
      setNextParams(data.next_page_params);
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      <h1 className="text-xl font-bold text-kite-text mb-4">Transactions</h1>

      <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_110px_110px_90px_70px] gap-3 px-4 py-3 border-b border-kite-border text-xs font-semibold text-kite-text-muted uppercase">
          <span>Tx Hash</span>
          <span>Block</span>
          <span>From</span>
          <span>To</span>
          <span>Value</span>
          <span>Status</span>
        </div>

        {txs.map((tx) => (
          <Link
            key={tx.hash}
            href={`/tx/${tx.hash}`}
            className="grid grid-cols-[1fr_80px_110px_110px_90px_70px] gap-3 px-4 py-2.5 border-b border-kite-border/20 hover:bg-[#15140E] transition-colors items-center"
          >
            <span className="text-xs font-mono text-kite-gold truncate">{tx.hash}</span>
            <span className="text-xs font-mono text-kite-text-secondary">{tx.block}</span>
            <span className="text-xs font-mono text-kite-text-secondary truncate">{shortenHash(tx.from?.hash || "", 4)}</span>
            <span className="text-xs font-mono text-kite-text-secondary truncate">{shortenHash(tx.to?.hash || "", 4)}</span>
            <span className="text-xs font-mono text-kite-text">{(parseFloat(tx.value) / 1e18).toFixed(4)}</span>
            <span className={`text-xs font-medium ${txStatusColor(tx.status)}`}>{txStatusLabel(tx.status)}</span>
          </Link>
        ))}

        {loading && (
          <div className="px-4 py-6 text-center text-kite-text-muted text-sm">Loading transactions...</div>
        )}
      </div>

      {nextParams && !loading && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => load(nextParams)}
            className="px-6 py-2 rounded-lg bg-kite-surface border border-kite-border text-sm text-kite-gold hover:bg-kite-surface-hover transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
