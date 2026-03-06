"use client";

import { AnimatedNumber } from "@/components/common/animated-number";
import type { ChainData } from "@/lib/hooks/use-chain-data";
import { formatNumber } from "@/lib/utils/format";

interface StatStripProps {
  data: ChainData;
}

export function StatStrip({ data }: StatStripProps) {
  const stats = [
    { label: "KITE Price", value: "$—" },
    { label: "Block Height", value: <AnimatedNumber value={data.blockNumber} /> },
    { label: "TPS", value: data.tps.toFixed(1) },
    { label: "Avg Block", value: data.avgBlockTime.toFixed(1) + "s" },
    { label: "Gas", value: data.gasPrice.toFixed(1) + " Gwei" },
    { label: "Addresses", value: formatNumber(data.addressCount, true) },
    { label: "Net Load", value: data.utilization.toFixed(1) + "%" },
  ];

  return (
    <div className="flex justify-center flex-wrap border-b border-kite-border bg-kite-surface">
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 px-4 py-2.5 border-r border-kite-border last:border-r-0"
        >
          <span className="text-[11px] text-kite-text-muted font-medium uppercase tracking-wider">
            {s.label}
          </span>
          <span className="text-[13px] text-kite-text font-semibold font-mono">
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
