"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { blockscout } from "@/lib/api/blockscout";
import type { Token, PaginatedResponse } from "@/lib/types/api";
import { formatNumber, shortenHash } from "@/lib/utils/format";

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [nextParams, setNextParams] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const data: PaginatedResponse<Token> = await blockscout.getTokens(params);
      if (params) {
        setTokens((prev) => [...prev, ...data.items]);
      } else {
        setTokens(data.items);
      }
      setNextParams(data.next_page_params);
    } catch (e) {
      console.error("Failed to load tokens", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      <h1 className="text-xl font-bold text-kite-text mb-4">Tokens</h1>

      <div className="bg-kite-surface rounded-[14px] border border-kite-border overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_120px_100px] gap-4 px-4 py-3 border-b border-kite-border text-xs font-semibold text-kite-text-muted uppercase">
          <span>Token</span>
          <span>Type</span>
          <span>Holders</span>
          <span>Total Supply</span>
          <span>Contract</span>
        </div>

        {tokens.length === 0 && !loading && (
          <div className="px-4 py-8 text-center text-kite-text-muted text-sm">No tokens found yet. The indexer may still be processing token data.</div>
        )}

        {tokens.map((token) => (
          <Link
            key={token.address}
            href={`/address/${token.address}`}
            className="grid grid-cols-[1fr_100px_100px_120px_100px] gap-4 px-4 py-3 border-b border-kite-border/20 hover:bg-[#15140E] transition-colors items-center"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-kite-gold-faint border border-kite-border flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-kite-gold">{token.symbol?.charAt(0) || "?"}</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-kite-text truncate">{token.name || "Unknown"}</div>
                <div className="text-xs text-kite-text-muted">{token.symbol}</div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-kite-gold-dim bg-kite-gold-faint px-2 py-0.5 rounded w-fit">{token.type}</span>
            <span className="text-xs text-kite-text-secondary">{formatNumber(token.holders)}</span>
            <span className="text-xs font-mono text-kite-text-secondary truncate">{formatNumber(token.total_supply, true)}</span>
            <span className="text-xs font-mono text-kite-text-muted">{shortenHash(token.address, 4)}</span>
          </Link>
        ))}

        {loading && (
          <div className="px-4 py-6 text-center text-kite-text-muted text-sm">Loading tokens...</div>
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
