"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface TxChartProps {
  data: { t: string; v: number }[];
}

export function TxChart({ data }: TxChartProps) {
  return (
    <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-transparent">
        <span className="text-sm font-semibold text-kite-text">Transaction Activity</span>
        <span className="text-[11px] text-kite-text-muted bg-kite-border/50 px-2 py-0.5 rounded font-mono">
          25 blocks
        </span>
      </div>

      <div className="px-2 pb-2 h-[220px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4A96A" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C4A96A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              tick={{ fill: "#5C574E", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#5C574E", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip suffix=" txns" />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#C4A96A"
              strokeWidth={2}
              fill="url(#txGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
