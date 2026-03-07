"use client";

import { useEffect, useState } from "react";
import { blockscout } from "@/lib/api/blockscout";
import type { ChainStats, TransactionChartData } from "@/lib/types/api";
import { formatNumber } from "@/lib/utils/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StatsPage() {
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; tx_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, c] = await Promise.all([
          blockscout.getStats(),
          blockscout.getTransactionCharts().catch(() => ({ chart_data: [] })),
        ]);
        setStats(s);
        setChartData(c.chart_data || []);
      } catch (e) {
        console.error("Failed to load stats", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="max-w-[1280px] mx-auto px-6 py-10 text-kite-text-muted">Loading stats...</div>;
  if (!stats) return <div className="max-w-[1280px] mx-auto px-6 py-10 text-red-400">Failed to load stats</div>;

  const cards: { label: string; value: string }[] = [
    { label: "Total Blocks", value: formatNumber(stats.total_blocks) },
    { label: "Total Transactions", value: formatNumber(stats.total_transactions) },
    { label: "Total Addresses", value: formatNumber(stats.total_addresses) },
    { label: "Avg Block Time", value: `${(stats.average_block_time / 1000).toFixed(1)}s` },
    { label: "Gas Used Today", value: formatNumber(stats.gas_used_today) },
    { label: "Network Utilization", value: `${stats.network_utilization_percentage.toFixed(2)}%` },
    { label: "Gas (Slow)", value: stats.gas_prices.slow ? `${stats.gas_prices.slow} Gwei` : "—" },
    { label: "Gas (Fast)", value: stats.gas_prices.fast ? `${stats.gas_prices.fast} Gwei` : "—" },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      <h1 className="text-xl font-bold text-kite-text mb-5">Charts & Stats</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-kite-surface rounded-[14px] border border-kite-border p-4">
            <div className="text-xs text-kite-text-muted mb-1.5">{c.label}</div>
            <div className="text-lg font-bold font-mono text-kite-text">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tx Chart */}
      {chartData.length > 0 && (
        <div className="bg-kite-surface rounded-[14px] border border-kite-border p-4">
          <h2 className="text-sm font-semibold text-kite-text mb-4">Daily Transactions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C4A96A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C4A96A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                tick={{ fill: "#5C574E", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5C574E", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111113",
                  border: "1px solid #1E1D18",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#9B9488" }}
                itemStyle={{ color: "#C4A96A" }}
              />
              <Area
                type="monotone"
                dataKey="tx_count"
                stroke="#C4A96A"
                strokeWidth={2}
                fill="url(#txGrad)"
                name="Transactions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
