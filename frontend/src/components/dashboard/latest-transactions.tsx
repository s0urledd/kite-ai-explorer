"use client";

import { hex, type RpcBlock, type RpcTransaction } from "@/lib/api/rpc";
import { shortenHash, timeAgo } from "@/lib/utils/format";

interface LatestTransactionsProps {
  blocks: RpcBlock[];
}

export function LatestTransactions({ blocks }: LatestTransactionsProps) {
  const txs = blocks
    .flatMap((b) => {
      const ts = hex(b.timestamp);
      return ((b.transactions || []) as RpcTransaction[])
        .slice(0, 2)
        .map((tx) => ({ ...tx, _ts: ts }));
    })
    .slice(0, 8);

  return (
    <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-kite-border/30">
        <span className="text-sm font-semibold text-kite-text">Latest Transactions</span>
        <button className="text-xs text-kite-gold-dim font-medium hover:text-kite-gold transition-colors">
          View all →
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {txs.map((tx, idx) => {
          const isContract = tx.input?.length > 10;
          const val = hex(tx.value);

          return (
            <div
              key={tx.hash + idx}
              className="flex items-start gap-3 px-4 py-2.5 border-b border-kite-border/20 cursor-pointer hover:bg-[#15140E] transition-colors"
            >
              <div
                className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                  isContract ? "bg-kite-gold-dim" : "bg-kite-gold"
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-kite-text-secondary truncate">
                  {tx.hash}
                </div>
                <div className="text-[11px] text-kite-text-muted mt-0.5">
                  {shortenHash(tx.from, 4)} → {shortenHash(tx.to || "", 4)}
                  {isContract && (
                    <span className="text-[10px] text-kite-gold-dim bg-kite-gold-faint px-1.5 py-px rounded ml-1.5 font-medium">
                      Contract
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-[13px] font-semibold font-mono text-kite-text">
                  {val === 0 ? "0" : (val / 1e18).toFixed(4)} KITE
                </div>
                <div className="text-[11px] text-kite-text-muted">
                  {timeAgo(tx._ts.toString())} ago
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
