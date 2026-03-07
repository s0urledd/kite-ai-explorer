"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { blockscout } from "@/lib/api/blockscout";
import type { Transaction, PaginatedResponse } from "@/lib/types/api";
import { shortenHash, txStatusLabel, txStatusColor } from "@/lib/utils/format";

export default function ContractsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data: PaginatedResponse<Transaction> = await blockscout.getTransactions({ type: "contract_creation" });
        setTxs(data.items || []);
      } catch (e) {
        console.error("Failed to load contracts", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      <h1 className="text-xl font-bold text-kite-text mb-4">Verified Contracts</h1>

      <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_140px_80px_100px] gap-3 px-4 py-3 border-b border-kite-border text-xs font-semibold text-kite-text-muted uppercase">
          <span>Tx Hash / Contract</span>
          <span>Creator</span>
          <span>Block</span>
          <span>Status</span>
          <span>Age</span>
        </div>

        {txs.length === 0 && !loading && (
          <div className="px-4 py-8 text-center text-kite-text-muted text-sm">No contract creations found yet.</div>
        )}

        {txs.map((tx) => (
          <div
            key={tx.hash}
            className="grid grid-cols-[1fr_140px_140px_80px_100px] gap-3 px-4 py-3 border-b border-kite-border/20 hover:bg-[#15140E] transition-colors items-center"
          >
            <div className="min-w-0">
              <Link href={`/tx/${tx.hash}`} className="text-xs font-mono text-kite-gold hover:underline truncate block">
                {shortenHash(tx.hash, 10)}
              </Link>
              {tx.to && (
                <Link href={`/address/${tx.to.hash}`} className="text-[11px] font-mono text-kite-text-secondary hover:text-kite-gold block mt-0.5 truncate">
                  → {shortenHash(tx.to.hash, 6)}
                </Link>
              )}
            </div>
            <Link href={`/address/${tx.from?.hash}`} className="text-xs font-mono text-kite-text-secondary hover:text-kite-gold truncate">
              {shortenHash(tx.from?.hash || "", 6)}
            </Link>
            <Link href={`/block/${tx.block}`} className="text-xs font-mono text-kite-text-secondary hover:text-kite-gold">
              {tx.block}
            </Link>
            <span className={`text-xs font-medium ${txStatusColor(tx.status)}`}>{txStatusLabel(tx.status)}</span>
            <span className="text-[11px] text-kite-text-muted">{new Date(tx.timestamp).toLocaleDateString()}</span>
          </div>
        ))}

        {loading && (
          <div className="px-4 py-6 text-center text-kite-text-muted text-sm">Loading contracts...</div>
        )}
      </div>
    </div>
  );
}
