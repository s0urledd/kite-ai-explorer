"use client";

import { AnimatedNumber } from "@/components/common/animated-number";
import type { ChainData } from "@/lib/hooks/use-chain-data";
import type { BlockscoutStats } from "@/lib/hooks/use-blockscout-stats";
import { useKitePrice } from "@/lib/hooks/use-kite-price";
import { formatNumber } from "@/lib/utils/format";

interface StatStripProps {
  data: ChainData;
  blockscoutStats: BlockscoutStats;
}

function StatItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-kite-text-muted font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[15px] font-bold font-mono text-kite-text">{children}</div>
    </div>
  );
}

export function StatStrip({ data, blockscoutStats }: StatStripProps) {
  const price = useKitePrice();
  const priceNum = parseFloat(price.priceUsd);
  const change = price.priceChange24h;
  const isPositive = change >= 0;

  const totalTx = parseInt(blockscoutStats.totalTransactions, 10) || 0;
  const tx24h = parseInt(blockscoutStats.transactions24h, 10) || 0;
  const totalAddresses = parseInt(blockscoutStats.totalAddresses, 10) || 0;

  // Calculate 24H TPS from Blockscout's transactions_today / seconds elapsed today (UTC)
  const now = new Date();
  const secondsElapsedToday = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const avgTps24h = secondsElapsedToday > 0 ? tx24h / secondsElapsedToday : 0;

  // Peak TPS from real-time RPC block data (already fixed calculation)
  const peakTps = data.peakTps;

  // Avg block time: prefer Blockscout (ms → s), fallback to RPC calculation
  const avgBlockTime = blockscoutStats.averageBlockTime > 0
    ? blockscoutStats.averageBlockTime / 1000
    : data.avgBlockTime;

  // Avg gas per transaction from recent blocks
  const avgGasPerTx = data.totalTx > 0
    ? Math.round(
        data.blocks.reduce((sum, b) => {
          const gu = parseInt(b.gasUsed, 16) || 0;
          return sum + gu;
        }, 0) / data.totalTx
      )
    : 0;

  const cards = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-text-muted">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: "Chain Pulse",
      items: [
        { label: "Total Txn", value: <AnimatedNumber value={totalTx} /> },
        { label: "24H Transactions", value: <AnimatedNumber value={tx24h} /> },
        { label: "Avg TPS (24H)", value: avgTps24h.toFixed(2) },
        { label: "Peak TPS (24H)", value: peakTps.toFixed(2) },
      ],
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-text-muted">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      title: "Block & Gas",
      items: [
        { label: "Current Block", value: <span>#<AnimatedNumber value={data.blockNumber} /></span> },
        { label: "Avg Block Time", value: avgBlockTime > 0 ? `${avgBlockTime.toFixed(1)}s` : "\u2014" },
        { label: "Gas Price", value: <span className="text-green-400">{data.gasPrice.toFixed(1)} Gwei</span> },
        { label: "Avg Gas/TXN", value: avgGasPerTx > 0 ? formatNumber(avgGasPerTx) : "\u2014" },
      ],
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-text-muted">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10l4-4 4 4"/>
        </svg>
      ),
      title: "Kite Economy",
      items: [
        { label: "KITE Price", value: priceNum > 0 ? `$${priceNum.toFixed(4)}` : "$\u2014" },
        {
          label: "24H Change",
          value: priceNum > 0 ? (
            <span className={isPositive ? "text-green-400" : "text-red-400"}>
              {isPositive ? "+" : ""}{change.toFixed(2)}%
            </span>
          ) : "\u2014",
        },
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
      title: "Network Activity",
      items: [
        { label: "Total Addresses", value: totalAddresses > 0 ? formatNumber(totalAddresses) : "\u2014" },
        { label: "New Addresses (24H)", value: blockscoutStats.newAddresses24h > 0 ? formatNumber(blockscoutStats.newAddresses24h) : "\u2014" },
        { label: "Total Contracts", value: blockscoutStats.totalContracts > 0 ? formatNumber(blockscoutStats.totalContracts) : "\u2014" },
        { label: "24H New Contracts", value: blockscoutStats.newContracts24h > 0 ? formatNumber(blockscoutStats.newContracts24h) : "\u2014" },
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
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[8px] bg-kite-bg border border-kite-border flex items-center justify-center flex-shrink-0">
                {card.icon}
              </div>
              <span className="text-[11px] text-kite-text-muted font-semibold uppercase tracking-wider">{card.title}</span>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {card.items.map((item) => (
                <StatItem key={item.label} label={item.label}>
                  {item.value}
                </StatItem>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
