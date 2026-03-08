"use client";

import { AnimatedNumber } from "@/components/common/animated-number";
import { KiteLogo } from "@/components/common/kite-logo";
import type { ChainData } from "@/lib/hooks/use-chain-data";
import { useKitePrice } from "@/lib/hooks/use-kite-price";

interface StatStripProps {
  data: ChainData;
}

export function StatStrip({ data }: StatStripProps) {
  const price = useKitePrice();
  const priceNum = parseFloat(price.priceUsd);
  const change = price.priceChange24h;
  const isPositive = change >= 0;

  const cards = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kite-text-muted">
          <circle cx="12" cy="12" r="10"/>
          <path d="M7 10h10l-3-3"/>
          <path d="M17 14H7l3 3"/>
        </svg>
      ),
      title: "Total Txn",
      main: <span className="text-xl font-bold font-mono text-kite-text"><AnimatedNumber value={data.totalTx} /></span>,
      rows: [
        { label: "TPS", value: data.tps.toFixed(1) },
        { label: "Peak TPS", value: data.peakTps.toFixed(1) },
      ],
    },
    {
      icon: (
        <span className="text-[14px] leading-none">⏹</span>
      ),
      title: "Current Block",
      main: <span className="text-xl font-bold font-mono text-kite-text">#<AnimatedNumber value={data.blockNumber} /></span>,
      rows: [
        { label: "Avg Block Time", value: data.avgBlockTime.toFixed(1) + "s" },
        { label: "Gas Price", value: data.gasPrice.toFixed(1) + " Gwei" },
      ],
    },
    {
      icon: (
        <KiteLogo size={16} />
      ),
      title: "KITE Price",
      main: (
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono text-kite-text">
            {priceNum > 0 ? `$${priceNum.toFixed(4)}` : "$\u2014"}
          </span>
          {priceNum > 0 && (
            <span className={`text-[12px] font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}{change.toFixed(2)}%
            </span>
          )}
        </div>
      ),
      rows: [
        { label: "Market Cap", value: price.marketCap > 0 ? `$${(price.marketCap / 1e6).toFixed(2)}M` : "\u2014" },
        { label: "FDV", value: price.fdv > 0 ? `$${(price.fdv / 1e9).toFixed(2)}B` : "\u2014" },
      ],
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-text-muted">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
      title: "Network Load",
      main: <span className="text-xl font-bold font-mono text-kite-text">{data.utilization.toFixed(1)}%</span>,
      rows: [
        { label: "Addresses", value: data.addressCount.toLocaleString() },
        { label: "Active Contracts", value: data.contracts.length.toLocaleString() },
      ],
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 -mt-1 mb-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-kite-surface rounded-[12px] border border-kite-border p-4 hover:border-kite-border-light transition-colors"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-[8px] bg-kite-bg border border-kite-border flex items-center justify-center flex-shrink-0">
                {card.icon}
              </div>
              <span className="text-[11px] text-kite-text-muted font-semibold uppercase tracking-wider">{card.title}</span>
            </div>

            {/* Main value */}
            <div className="mb-3">{card.main}</div>

            {/* Sub rows */}
            <div className="pt-2.5 space-y-1.5">
              {card.rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-white">{row.label}</span>
                  <span className="text-[12px] font-mono font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
