"use client";

import { AnimatedNumber } from "@/components/common/animated-number";
import type { ChainData } from "@/lib/hooks/use-chain-data";
import { useKitePrice } from "@/lib/hooks/use-kite-price";
import { hex } from "@/lib/api/rpc";
import { type ReactNode } from "react";

interface StatStripProps {
  data: ChainData;
}

interface MetricCell {
  label: string;
  value: ReactNode;
}

interface StatCard {
  title: string;
  accentHex: string;
  icon: ReactNode;
  metrics: MetricCell[];
}

function GasColorValue({ gwei }: { gwei: number }) {
  const color =
    gwei < 5 ? "text-green-400" : gwei < 20 ? "text-yellow-400" : "text-red-400";
  return (
    <span className={`font-mono font-semibold ${color}`}>
      {gwei.toFixed(1)} Gwei
    </span>
  );
}

function ChangeBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none ${
        isPositive
          ? "bg-green-500/15 text-green-400"
          : "bg-red-500/15 text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function StatStrip({ data }: StatStripProps) {
  const price = useKitePrice();
  const priceNum = parseFloat(price.priceUsd);
  const change = price.priceChange24h;

  const avgGasPerTx =
    data.transactionsToday > 0
      ? Math.round(data.gasUsedToday / data.transactionsToday)
      : 0;

  const latestBlock = data.blocks[0];
  const latestBlockTxCount = latestBlock
    ? ((latestBlock.transactions as unknown[]) || []).length
    : 0;
  const latestBlockSize = latestBlock ? hex(latestBlock.size) : 0;

  const cards: StatCard[] = [
    // ── Card 1: Chain Pulse ──
    {
      title: "Chain Pulse",
      accentHex: "#C4A96A",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      metrics: [
        {
          label: "Total Transactions",
          value: <AnimatedNumber value={data.totalTx} />,
        },
        {
          label: "24H Transactions",
          value:
            data.transactionsToday > 0
              ? data.transactionsToday.toLocaleString()
              : "\u2014",
        },
        { label: "TPS", value: data.tps.toFixed(1) },
        { label: "Peak TPS", value: data.peakTps.toFixed(1) },
        {
          label: "Total Accounts",
          value: <AnimatedNumber value={data.addressCount} />,
        },
        { label: "24H New Accounts", value: "\u2014" },
      ],
    },
    // ── Card 2: Block & Gas ──
    {
      title: "Block & Gas",
      accentHex: "#5BA3A8",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
      metrics: [
        {
          label: "Current Block",
          value: (
            <span>
              #<AnimatedNumber value={data.blockNumber} />
            </span>
          ),
        },
        {
          label: "Avg Block Time",
          value: data.avgBlockTime.toFixed(1) + "s",
        },
        { label: "Gas Price", value: <GasColorValue gwei={data.gasPrice} /> },
        {
          label: "Avg Gas/TXN",
          value: avgGasPerTx > 0 ? avgGasPerTx.toLocaleString() : "\u2014",
        },
        {
          label: "TXN in Block",
          value: latestBlockTxCount.toLocaleString(),
        },
        {
          label: "Block Size",
          value:
            latestBlockSize > 0
              ? `${(latestBlockSize / 1024).toFixed(1)} KB`
              : "\u2014",
        },
      ],
    },
    // ── Card 3: KITE Economy ──
    {
      title: "KITE Economy",
      accentHex: "#5BAA7C",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      metrics: [
        {
          label: "KITE Price",
          value: priceNum > 0 ? `$${priceNum.toFixed(4)}` : "$\u2014",
        },
        {
          label: "24H Change",
          value: priceNum > 0 ? <ChangeBadge value={change} /> : "\u2014",
        },
        {
          label: "Market Cap",
          value:
            price.marketCap > 0
              ? `$${(price.marketCap / 1e6).toFixed(2)}M`
              : "\u2014",
        },
        {
          label: "FDV",
          value:
            price.fdv > 0 ? `$${(price.fdv / 1e9).toFixed(2)}B` : "\u2014",
        },
        { label: "Total Supply", value: "\u2014" },
        { label: "Burnt KITE", value: "\u2014" },
      ],
    },
    // ── Card 4: Network Activity ──
    {
      title: "Network Activity",
      accentHex: "#A87BC4",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
        </svg>
      ),
      metrics: [
        {
          label: "Total Wallets",
          value: <AnimatedNumber value={data.addressCount} />,
        },
        { label: "New Wallets (24H)", value: "\u2014" },
        {
          label: "Total Contracts",
          value:
            data.contracts.length > 0
              ? data.contracts.length.toLocaleString()
              : "\u2014",
        },
        { label: "24H New Contracts", value: "\u2014" },
        { label: "Total Tokens", value: "\u2014" },
        { label: "24H New Tokens", value: "\u2014" },
      ],
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 -mt-1 mb-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="relative bg-kite-surface rounded-[12px] overflow-hidden transition-all duration-300 hover:scale-[1.01] group"
            style={{
              boxShadow: `0 0 0 1px ${card.accentHex}15`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                `0 0 12px ${card.accentHex}25, 0 0 0 1px ${card.accentHex}30`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                `0 0 0 1px ${card.accentHex}15`;
            }}
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
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${card.accentHex}12`,
                    color: card.accentHex,
                    filter: `drop-shadow(0 0 8px ${card.accentHex}66)`,
                  }}
                >
                  {card.icon}
                </div>
                <span className="text-[11px] text-kite-text-muted font-semibold uppercase tracking-wider">
                  {card.title}
                </span>
              </div>

              {/* 3×2 metrics grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {card.metrics.map((m) => (
                  <div key={m.label}>
                    <div
                      className="text-[10px] uppercase tracking-wide mb-0.5"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {m.label}
                    </div>
                    <div className="text-[13px] font-mono font-semibold text-white">
                      {typeof m.value === "string" ? m.value : m.value}
                    </div>
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
