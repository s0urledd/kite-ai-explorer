"use client";

import { useState } from "react";
import { useChainData } from "@/lib/hooks/use-chain-data";
import { useChartData, type TimeRange } from "@/lib/hooks/use-chart-data";
import { SearchBar } from "@/components/layout/search-bar";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { LatestBlocks } from "@/components/dashboard/latest-blocks";
import { LatestTransactions } from "@/components/dashboard/latest-transactions";
import { TxChart } from "@/components/dashboard/tx-chart";
import { GasChart } from "@/components/dashboard/gas-chart";
import { ActiveContracts } from "@/components/dashboard/active-contracts";

export default function DashboardPage() {
  const data = useChainData();
  const [txRange, setTxRange] = useState<TimeRange>("1H");
  const [gasRange, setGasRange] = useState<TimeRange>("1H");

  const txChart = useChartData(data.blockNumber, txRange);
  const gasChart = useChartData(data.blockNumber, gasRange);

  const txChartData = txRange === "1H" ? data.txHistory : txChart.txData;
  const gasChartData = gasRange === "1H" ? data.gasHistory : gasChart.gasData;

  return (
    <div>
      <SearchBar />
      <StatStrip data={data} />

      <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col gap-3.5">
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <TxChart data={txChartData} onRangeChange={setTxRange} />
          <GasChart data={gasChartData} onRangeChange={setGasRange} />
        </div>

        {/* Latest Blocks & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <LatestBlocks blocks={data.blocks} />
          <LatestTransactions blocks={data.blocks} />
        </div>

        {/* Active Contracts */}
        <ActiveContracts contracts={data.contracts} />
      </div>
    </div>
  );
}
