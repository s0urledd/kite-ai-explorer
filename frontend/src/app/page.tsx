"use client";

import { useChainData } from "@/lib/hooks/use-chain-data";
import { useBlockscoutStats } from "@/lib/hooks/use-blockscout-stats";
import { SearchBar } from "@/components/layout/search-bar";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { LatestBlocks } from "@/components/dashboard/latest-blocks";
import { LatestTransactions } from "@/components/dashboard/latest-transactions";
import { TxChart } from "@/components/dashboard/tx-chart";
import { GasChart } from "@/components/dashboard/gas-chart";
import { ActiveContracts } from "@/components/dashboard/active-contracts";

export default function DashboardPage() {
  const data = useChainData();
  const { stats: blockscoutStats } = useBlockscoutStats();

  return (
    <div>
      <SearchBar />
      <StatStrip data={data} blockscoutStats={blockscoutStats} />

      <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col gap-3.5">
        {/* Charts Row - instant data overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <TxChart data={data.txHistory} />
          <GasChart data={data.gasHistory} />
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
