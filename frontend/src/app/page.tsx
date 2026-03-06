/**
 * Dashboard — Main page
 *
 * Layout:
 * 1. Search bar (hero)
 * 2. Stat strip (block height, TPS, gas, addresses, net load)
 * 3. Latest Blocks + Latest Transactions (side by side)
 * 4. Transaction Activity chart + Gas Utilization chart
 * 5. Active Contracts leaderboard
 *
 * Data source: Blockscout v2 API via @/lib/api/blockscout
 */

// TODO: Implement dashboard with real Blockscout data
// See docs/ARCHITECTURE.md for API endpoints
// See the prototype JSX in conversation history for design reference

export default function DashboardPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-kite-text mb-4">
        Kite Explorer
      </h1>
      <p className="text-kite-text-secondary">
        Dashboard coming soon. Blockscout backend must be running.
      </p>
    </div>
  );
}
