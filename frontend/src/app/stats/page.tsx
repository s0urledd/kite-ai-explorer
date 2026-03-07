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
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export default function StatsPage() {
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; tx_count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"area" | "bar">("area");

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

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-kite-surface rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 bg-kite-surface rounded-[14px]" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="max-w-[1280px] mx-auto px-6 py-10 text-red-400">Failed to load stats</div>;

  const primaryStats = [
    {
      label: "Total Blocks",
      value: formatNumber(stats.total_blocks),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-gold"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      label: "Total Transactions",
      value: formatNumber(stats.total_transactions),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-gold"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      label: "Wallet Addresses",
      value: formatNumber(stats.total_addresses),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-gold"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      label: "Avg Block Time",
      value: `${(stats.average_block_time / 1000).toFixed(1)}s`,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-kite-gold"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
  ];

  const networkStats = [
    { label: "Transactions Today", value: formatNumber(stats.transactions_today) },
    { label: "Gas Used Today", value: formatNumber(stats.gas_used_today) },
    { label: "Network Utilization", value: `${stats.network_utilization_percentage.toFixed(2)}%` },
    { label: "Total Gas Used", value: formatNumber(stats.total_gas_used, true) },
  ];

  const gasCards = [
    { label: "Slow", value: stats.gas_prices.slow ?? "—", color: "text-yellow-400" },
    { label: "Average", value: stats.gas_prices.average ?? "—", color: "text-kite-gold" },
    { label: "Fast", value: stats.gas_prices.fast ?? "—", color: "text-green-400" },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-kite-text mb-6">Charts & Stats</h1>

      {/* Primary Stats with Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {primaryStats.map((s) => (
          <div key={s.label} className="bg-kite-surface rounded-[14px] border border-kite-border p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-kite-gold-faint border border-kite-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              {s.icon}
            </div>
            <div>
              <div className="text-[11px] text-kite-text-muted uppercase tracking-wider mb-1">{s.label}</div>
              <div className="text-xl font-bold font-mono text-kite-text">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Network Activity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {networkStats.map((s) => (
          <div key={s.label} className="bg-kite-surface rounded-[14px] border border-kite-border p-4">
            <div className="text-[11px] text-kite-text-muted uppercase tracking-wider mb-1.5">{s.label}</div>
            <div className="text-lg font-bold font-mono text-kite-text">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Gas Prices */}
      <div className="bg-kite-surface rounded-[14px] border border-kite-border p-5 mb-6">
        <h2 className="text-sm font-semibold text-kite-text mb-4">Gas Tracker</h2>
        <div className="grid grid-cols-3 gap-4">
          {gasCards.map((g) => (
            <div key={g.label} className="bg-kite-bg rounded-[10px] border border-kite-border p-4 text-center">
              <div className="text-[11px] text-kite-text-muted uppercase tracking-wider mb-2">{g.label}</div>
              <div className={`text-2xl font-bold font-mono ${g.color}`}>{g.value}</div>
              <div className="text-[11px] text-kite-text-muted mt-1">Gwei</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-kite-surface rounded-[14px] border border-kite-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-kite-text">Daily Transactions</h2>
            <div className="flex gap-1 bg-kite-bg rounded-[8px] border border-kite-border p-0.5">
              <button
                onClick={() => setActiveChart("area")}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${activeChart === "area" ? "bg-kite-gold-faint text-kite-gold" : "text-kite-text-muted hover:text-kite-text"}`}
              >
                Area
              </button>
              <button
                onClick={() => setActiveChart("bar")}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${activeChart === "bar" ? "bg-kite-gold-faint text-kite-gold" : "text-kite-text-muted hover:text-kite-text"}`}
              >
                Bar
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={340}>
            {activeChart === "area" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="txGradStats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C4A96A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C4A96A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1D18" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} tick={{ fill: "#5C574E", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5C574E", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v, true)} />
                <Tooltip contentStyle={{ backgroundColor: "#111113", border: "1px solid #2A2820", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#9B9488" }} itemStyle={{ color: "#C4A96A" }} labelFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} formatter={(value: number) => [formatNumber(value), "Transactions"]} />
                <Area type="monotone" dataKey="tx_count" stroke="#C4A96A" strokeWidth={2} fill="url(#txGradStats)" name="Transactions" />
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1D18" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} tick={{ fill: "#5C574E", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5C574E", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v, true)} />
                <Tooltip contentStyle={{ backgroundColor: "#111113", border: "1px solid #2A2820", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#9B9488" }} itemStyle={{ color: "#C4A96A" }} />
                <Bar dataKey="tx_count" fill="#C4A96A" radius={[4, 4, 0, 0]} name="Transactions" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
