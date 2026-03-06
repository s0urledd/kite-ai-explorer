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

interface GasChartProps {
  data: { t: string; v: number }[];
}

export function GasChart({ data }: GasChartProps) {
  return (
    <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-kite-border/30">
        <span className="text-sm font-semibold text-kite-text">Gas Utilization</span>
        <span className="text-[11px] text-kite-text-muted bg-kite-border/50 px-2 py-0.5 rounded font-mono">
          % per block
        </span>
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
