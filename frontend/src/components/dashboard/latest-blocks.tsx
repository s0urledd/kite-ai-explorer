"use client";

import Link from "next/link";
import { hex, type RpcBlock } from "@/lib/api/rpc";
import { shortenHash, timeAgo } from "@/lib/utils/format";

interface LatestBlocksProps {
  blocks: RpcBlock[];
}

export function LatestBlocks({ blocks }: LatestBlocksProps) {
  return (
    <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-kite-border/30">
        <span className="text-sm font-semibold text-kite-text">Latest Blocks</span>
        <Link href="/blocks" className="text-xs text-kite-gold-dim font-medium hover:text-kite-gold transition-colors">
          View all →
        </Link>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {blocks.map((b) => {
          const n = hex(b.number);
          const tc = Array.isArray(b.transactions) ? b.transactions.length : 0;
          const ts = hex(b.timestamp);
          const gu = hex(b.gasUsed);
          const gl = hex(b.gasLimit);
          const pct = gl > 0 ? ((gu / gl) * 100).toFixed(0) : "0";

          return (
            <div
              key={n}
              className="flex items-start gap-3 px-4 py-2.5 border-b border-kite-border/20 cursor-pointer hover:bg-[#15140E] transition-colors"
            >
              <div className="flex-shrink-0 min-w-[90px]">
                <span className="text-[13px] font-mono font-bold text-kite-gold">
                  {n.toLocaleString()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs text-kite-text-secondary">{tc} txns</span>
                  <span className="text-kite-text-muted mx-0.5">·</span>
                  <span className="text-xs text-kite-text-muted">{pct}% gas</span>
                </div>
                <div className="text-[11px] text-kite-text-muted">
                  Validator{" "}
                  <span className="text-kite-text-secondary font-mono">
                    {shortenHash(b.miner, 4)}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-[13px] font-semibold font-mono text-kite-text">0 KITE</div>
                <div className="text-[11px] text-kite-text-muted">{timeAgo(ts.toString())} ago</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
