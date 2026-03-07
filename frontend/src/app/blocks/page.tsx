"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { blockscout } from "@/lib/api/blockscout";
import type { Block, PaginatedResponse } from "@/lib/types/api";
import { formatNumber, gasPercentage, shortenHash } from "@/lib/utils/format";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [nextParams, setNextParams] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const data: PaginatedResponse<Block> = await blockscout.getBlocks(params);
      if (params) {
        setBlocks((prev) => [...prev, ...data.items]);
      } else {
        setBlocks(data.items);
      }
      setNextParams(data.next_page_params);
    } catch (e) {
      console.error("Failed to load blocks", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      <h1 className="text-xl font-bold text-kite-text mb-4">Blocks</h1>

      <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[100px_1fr_100px_100px_120px_80px] gap-4 px-4 py-3 border-b border-kite-border text-xs font-semibold text-kite-text-muted uppercase">
          <span>Block</span>
          <span>Validator</span>
          <span>Txns</span>
          <span>Gas Used</span>
          <span>Gas %</span>
          <span>Age</span>
        </div>

        {/* Rows */}
        {blocks.map((b) => (
          <Link
            key={b.height}
            href={`/block/${b.height}`}
            className="grid grid-cols-[100px_1fr_100px_100px_120px_80px] gap-4 px-4 py-2.5 border-b border-kite-border/20 hover:bg-[#15140E] transition-colors items-center"
          >
            <span className="text-sm font-mono font-bold text-kite-gold">{formatNumber(b.height)}</span>
            <span className="text-xs font-mono text-kite-text-secondary truncate">{shortenHash(b.miner?.hash || "", 6)}</span>
            <span className="text-xs text-kite-text-secondary">{b.tx_count}</span>
            <span className="text-xs font-mono text-kite-text-secondary">{formatNumber(b.gas_used)}</span>
            <span className="text-xs text-kite-text-secondary">{gasPercentage(b.gas_used, b.gas_limit)}</span>
            <span className="text-[11px] text-kite-text-muted">{new Date(b.timestamp).toLocaleTimeString()}</span>
          </Link>
        ))}

        {loading && (
          <div className="px-4 py-6 text-center text-kite-text-muted text-sm">Loading blocks...</div>
        )}
      </div>

      {nextParams && !loading && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => load(nextParams)}
            className="px-6 py-2 rounded-lg bg-kite-surface border border-kite-border text-sm text-kite-gold hover:bg-kite-surface-hover transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
