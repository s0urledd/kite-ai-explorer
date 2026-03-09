"use client";

import { AnimatedNumber } from "@/components/common/animated-number";
import type { ChainData } from "@/lib/hooks/use-chain-data";
import { useKitePrice } from "@/lib/hooks/use-kite-price";
import { type ReactNode } from "react";

interface StatStripProps {
  data: ChainData;
}

interface StatCard {
  title: string;
  accent: string;        // tailwind color class stem (e.g. "kite-accent-gold")
  accentHex: string;     // raw hex for inline styles
  icon: ReactNode;
  main: ReactNode;
  rows: { label: string; value: ReactNode }[];
}

function GasColorValue({ gwei }: { gwei: number }) {
  const color = gwei < 5 ? "text-green-400" : gwei < 20 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-[12px] font-mono font-semibold ${color}`}>{gwei.toFixed(1)} Gwei</span>;
}

export function StatStrip({ data }: StatStripProps) {
  const price = useKitePrice();
  const priceNum = parseFloat(price.priceUsd);
  const change = price.priceChange24h;
  const isPositive = change >= 0;

  // Avg gas per tx from today's data
  const avgGasPerTx =
    data.transactionsToday > 0
      ? Math.round(data.gasUsedToday / data.transactionsToday)
      : 0;

  const cards: StatCard[] = [
    // ── Card 1: Chain Pulse ──
    {
      title: "Chain Pulse",
      accent: "kite-accent-gold",
      accentHex: "#C4A96A",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      main: (
        <span className="text-xl font-bold font-mono text-kite-text">
          <AnimatedNumber value={data.totalTx} />
        </span>
      ),
      rows: [
        {
          label: "24H TXN",
          value: data.transactionsToday > 0 ? data.transactionsToday.toLocaleString() : "—",
        },
        { label: "TPS", value: data.tps.toFixed(1) },
        { label: "Peak TPS", value: data.peakTps.toFixed(1) },
      ],
    },
    // ── Card 2: Block & Gas ──
    {
      title: "Block & Gas",
      accent: "kite-accent-teal",
      accentHex: "#5BA3A8",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
      ),
      main: (
        <span className="text-xl font-bold font-mono text-kite-text">
          #<AnimatedNumber value={data.blockNumber} />
        </span>
      ),
      rows: [
        { label: "Avg Block Time", value: data.avgBlockTime.toFixed(1) + "s" },
        { label: "Gas Price", value: <GasColorValue gwei={data.gasPrice} /> },
        {
          label: "Avg Gas/TXN",
          value: avgGasPerTx > 0 ? avgGasPerTx.toLocaleString() : "—",
        },
      ],
    },
    // ── Card 3: KITE Economy ──
    {
      title: "KITE Economy",
      accent: "kite-accent-emerald",
      accentHex: "#5BAA7C",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
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
        {
          label: "Market Cap",
          value: price.marketCap > 0 ? `$${(price.marketCap / 1e6).toFixed(2)}M` : "\u2014",
        },
        {
          label: "24H Volume",
          value: price.volume24h > 0 ? `$${(price.volume24h / 1e3).toFixed(1)}K` : "\u2014",
        },
        {
          label: "Liquidity",
          value: price.liquidity > 0 ? `$${(price.liquidity / 1e3).toFixed(1)}K` : "\u2014",
        },
      ],
    },
    // ── Card 4: Network Activity ──
    {
      title: "Network Activity",
      accent: "kite-accent-lavender",
      accentHex: "#A87BC4",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2"/>
          <path d="M12 2v4"/>
          <path d="M12 18v4"/>
          <path d="M4.93 4.93l2.83 2.83"/>
          <path d="M16.24 16.24l2.83 2.83"/>
          <path d="M2 12h4"/>
          <path d="M18 12h4"/>
          <path d="M4.93 19.07l2.83-2.83"/>
          <path d="M16.24 7.76l2.83-2.83"/>
        </svg>
      ),
      main: (
        <span className="text-xl font-bold font-mono text-kite-text">
          <AnimatedNumber value={data.addressCount} />
        </span>
      ),
      rows: [
        {
          label: "Utilization",
          value: data.utilization.toFixed(1) + "%",
        },
        {
          label: "Active Contracts",
          value: data.contracts.length.toLocaleString(),
        },
        {
          label: "Total Blocks",
          value: data.totalBlocks > 0 ? data.totalBlocks.toLocaleString() : "—",
        },
      ],
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 -mt-1 mb-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="relative bg-kite-surface rounded-[12px] border border-kite-border overflow-hidden hover:border-kite-border-light transition-all group"
          >
            {/* Top accent gradient line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, ${card.accentHex}00 0%, ${card.accentHex} 50%, ${card.accentHex}00 100%)`,
              }}
            />

            <div className="p-4 pt-5">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${card.accentHex}12`,
                    color: card.accentHex,
                  }}
                >
                  {card.icon}
                </div>
                <span className="text-[11px] text-kite-text-muted font-semibold uppercase tracking-wider">
                  {card.title}
                </span>
              </div>

              {/* Main value */}
              <div className="mb-3">{card.main}</div>

              {/* Sub rows */}
              <div className="pt-2.5 space-y-1.5">
                {card.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-white">{row.label}</span>
                    {typeof row.value === "string" ? (
                      <span className="text-[12px] font-mono font-semibold text-white">
                        {row.value}
                      </span>
                    ) : (
                      row.value
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
