/** Shorten address/hash: 0x1234...abcd */
export function shortenHash(hash: string, chars = 6): string {
  if (!hash) return "—";
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`;
}

/** Format large numbers: 1,234,567 or 1.23M */
export function formatNumber(n: number | string, compact = false): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  if (compact) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

/** Wei to KITE (18 decimals) */
export function weiToKite(wei: string | bigint, decimals = 4): string {
  const value = typeof wei === "string" ? BigInt(wei) : wei;
  const whole = value / BigInt(1e18);
  const frac = value % BigInt(1e18);
  const fracStr = frac.toString().padStart(18, "0").slice(0, decimals);
  if (whole === 0n && frac === 0n) return "0";
  return `${whole}.${fracStr}`.replace(/\.?0+$/, "") || "0";
}

/** Wei to Gwei */
export function weiToGwei(wei: string | number): string {
  const num = typeof wei === "string" ? parseFloat(wei) : wei;
  return (num / 1e9).toFixed(2);
}

/** Relative time: "3s ago", "5m ago", "2h ago" */
export function timeAgo(timestamp: string | number): string {
  const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp * 1000;
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 3) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Gas usage percentage */
export function gasPercentage(used: string, limit: string): string {
  const u = parseFloat(used);
  const l = parseFloat(limit);
  if (l === 0) return "0%";
  return `${((u / l) * 100).toFixed(1)}%`;
}

/** Tx status to label */
export function txStatusLabel(status: "ok" | "error" | null): string {
  if (status === "ok") return "Success";
  if (status === "error") return "Failed";
  return "Pending";
}

/** Tx status to color class */
export function txStatusColor(status: "ok" | "error" | null): string {
  if (status === "ok") return "text-green-400";
  if (status === "error") return "text-red-400";
  return "text-yellow-400";
}
