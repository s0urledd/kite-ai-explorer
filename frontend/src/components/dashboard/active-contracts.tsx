"use client";

import { shortenHash, formatNumber } from "@/lib/utils/format";

interface Contract {
  address: string;
  calls: number;
  callers: number;
}

interface ActiveContractsProps {
  contracts: Contract[];
}

export function ActiveContracts({ contracts }: ActiveContractsProps) {
  return (
    <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-kite-border/30">
        <span className="text-sm font-semibold text-kite-text">Active Contracts</span>
        <span className="text-[11px] text-kite-text-muted bg-kite-border/50 px-2 py-0.5 rounded font-mono">
          {contracts.length} tracked
        </span>
      </div>

      {/* Header */}
      <div className="flex px-4 py-2 text-[11px] text-kite-text-muted font-semibold uppercase tracking-wider border-b border-kite-border/25">
        <span className="flex-1">#</span>
        <span className="flex-[4]">Contract Address</span>
        <span className="flex-[2] text-right">Unique Callers</span>
        <span className="flex-[2] text-right">Interactions</span>
      </div>

      {/* Rows */}
      {contracts.map((c, i) => (
        <div
          key={c.address}
          className="flex items-center px-4 py-2.5 border-b border-kite-border/10 cursor-pointer hover:bg-[#15140E] transition-colors"
        >
          <span className="flex-1 font-mono text-[13px] text-kite-gold-dim font-semibold">
            {i + 1}
          </span>
          <span className="flex-[4] font-mono text-[13px] text-kite-text-secondary">
            {shortenHash(c.address)}
          </span>
          <span className="flex-[2] text-right font-mono text-[13px] text-kite-text-secondary">
            {formatNumber(c.callers, true)}
          </span>
          <span className="flex-[2] text-right font-mono text-[13px] text-kite-gold font-semibold">
            {formatNumber(c.calls, true)}
          </span>
        </div>
      ))}

      {contracts.length === 0 && (
        <div className="py-6 text-center text-kite-text-muted text-[13px]">
          Loading contract data...
        </div>
      )}
    </div>
  );
}
