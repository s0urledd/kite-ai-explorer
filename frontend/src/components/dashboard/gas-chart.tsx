"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

type TimeRange = "1H" | "24H" | "1W";

interface GasChartProps {
  data: { t: string; v: number }[];
  onRangeChange?: (range: TimeRange) => void;
}

export function GasChart({ data, onRangeChange }: GasChartProps) {
  const [range, setRange] = useState<TimeRange>("1H");

  const handleRange = (r: TimeRange) => {
    setRange(r);
    onRangeChange?.(r);
  };

  return (
    <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-transparent">
        <span className="text-sm font-semibold text-kite-text">Gas Utilization</span>
        <div className="flex items-center gap-1">
          {(["1H", "24H", "1W"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRange(r)}
              className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                range === r
                  ? "bg-kite-gold/20 text-kite-gold"
                  : "text-kite-text-muted hover:text-kite-text bg-kite-bg"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-2 h-[220px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B7A4E" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B7A4E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              tick={{ fill: "#FFFFFF", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#FFFFFF", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip suffix="%" />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#8B7A4E"
              strokeWidth={2}
              fill="url(#gasGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
