"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { blockscout } from "@/lib/api/blockscout";
import type { Address, Transaction, PaginatedResponse } from "@/lib/types/api";
import { weiToKite, shortenHash, txStatusLabel, txStatusColor, formatNumber } from "@/lib/utils/format";

export default function AddressPage() {
  const { hash } = useParams<{ hash: string }>();
  const [address, setAddress] = useState<Address | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [counters, setCounters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hash) return;
    (async () => {
      try {
        const [addr, txData, ctr] = await Promise.all([
          blockscout.getAddress(hash),
          blockscout.getAddressTransactions(hash),
          blockscout.getAddressCounters(hash).catch(() => ({})),
        ]);
        setAddress(addr);
        setTxs(txData.items || []);
        setCounters(ctr);
      } catch (e) {
        console.error("Failed to load address", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [hash]);

  if (loading) return <div className="max-w-[1280px] mx-auto px-6 py-10 text-kite-text-muted">Loading address...</div>;
  if (!address) return <div className="max-w-[1280px] mx-auto px-6 py-10 text-red-400">Address not found</div>;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="text-xl font-bold text-kite-text">
          {address.is_contract ? "Contract" : "Address"}
        </h1>
        <span className="font-mono text-sm text-kite-text-secondary break-all">{address.hash}</span>
        {address.name && <span className="text-kite-gold text-sm font-medium">({address.name})</span>}
        {address.is_verified && (
          <span className="text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Verified</span>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-kite-surface rounded-[14px] border border-kite-border p-4">
          <div className="text-xs text-kite-text-muted mb-1">Balance</div>
          <div className="text-lg font-bold font-mono text-kite-text">{weiToKite(address.coin_balance || "0")} KITE</div>
        </div>
        <div className="bg-kite-surface rounded-[14px] border border-kite-border p-4">
          <div className="text-xs text-kite-text-muted mb-1">Transactions</div>
          <div className="text-lg font-bold font-mono text-kite-text">{formatNumber(counters.transactions_count || "0")}</div>
        </div>
        <div className="bg-kite-surface rounded-[14px] border border-kite-border p-4">
          <div className="text-xs text-kite-text-muted mb-1">Gas Used</div>
          <div className="text-lg font-bold font-mono text-kite-text">{formatNumber(counters.gas_usage_count || "0")}</div>
        </div>
        <div className="bg-kite-surface rounded-[14px] border border-kite-border p-4">
          <div className="text-xs text-kite-text-muted mb-1">Token Transfers</div>
          <div className="text-lg font-bold font-mono text-kite-text">{formatNumber(counters.token_transfers_count || "0")}</div>
        </div>
      </div>

      {/* Transactions */}
      <h2 className="text-lg font-semibold text-kite-text mb-3">Transactions</h2>
      <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-3 px-4 py-3 border-b border-kite-border text-xs font-semibold text-kite-text-muted uppercase">
          <span>Tx Hash</span>
          <span>Block</span>
          <span>From/To</span>
          <span>Value</span>
          <span>Status</span>
        </div>
        {txs.length === 0 && (
          <div className="px-4 py-6 text-center text-kite-text-muted text-sm">No transactions found</div>
        )}
        {txs.map((tx) => {
          const isIncoming = tx.to?.hash?.toLowerCase() === hash.toLowerCase();
          return (
            <Link
              key={tx.hash}
              href={`/tx/${tx.hash}`}
              className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-3 px-4 py-2.5 border-b border-kite-border/20 hover:bg-[#15140E] transition-colors items-center"
            >
              <span className="text-xs font-mono text-kite-gold truncate">{tx.hash}</span>
              <Link href={`/block/${tx.block}`} className="text-xs font-mono text-kite-text-secondary hover:text-kite-gold">{tx.block}</Link>
              <span className="text-xs text-kite-text-secondary">
                <span className={`inline-block px-1.5 py-px rounded text-[10px] font-medium mr-1 ${isIncoming ? "bg-green-400/10 text-green-400" : "bg-kite-gold-faint text-kite-gold-dim"}`}>
                  {isIncoming ? "IN" : "OUT"}
                </span>
                {shortenHash(isIncoming ? tx.from?.hash || "" : tx.to?.hash || "", 4)}
              </span>
              <span className="text-xs font-mono text-kite-text">{(parseFloat(tx.value) / 1e18).toFixed(4)}</span>
              <span className={`text-xs font-medium ${txStatusColor(tx.status)}`}>{txStatusLabel(tx.status)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
