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
  const [txRange, setTxRange] = useState<TimeRange>("24H");
  const [gasRange, setGasRange] = useState<TimeRange>("24H");

  const txChart = useChartData(data.blockNumber, txRange, data.avgBlockTime);
  const gasChart = useChartData(data.blockNumber, gasRange, data.avgBlockTime);
  // Always fetch 24H chart for peak TPS calculation
  const tx24hChart = useChartData(data.blockNumber, "24H", data.avgBlockTime);

  // Peak TPS (24H): highest hourly TX count / 3600
  const peakTps24h = tx24hChart.txData.length > 0
    ? Math.max(...tx24hChart.txData.map((p) => p.v)) / 3600
    : data.peakTps;

  return (
    <div>
      <SearchBar />
      <StatStrip data={data} peakTps24h={peakTps24h} />

      <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col gap-3.5">
        {/* Latest Blocks & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <LatestBlocks blocks={data.blocks} />
          <LatestTransactions blocks={data.blocks} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <TxChart data={txChart.txData} loading={txChart.loading} onRangeChange={setTxRange} />
          <GasChart data={gasChart.gasData} loading={gasChart.loading} onRangeChange={setGasRange} />
        </div>

        {/* Active Contracts */}
        <ActiveContracts contracts={data.contracts} />
      </div>
    </div>
  );
}
