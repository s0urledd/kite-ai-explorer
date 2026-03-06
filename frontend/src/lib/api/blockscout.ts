import { BLOCKSCOUT_API_URL } from "@/lib/config/chain";
import type {
  ChainStats,
  Block,
  Transaction,
  Address,
  Token,
  SearchResult,
  PaginatedResponse,
  TransactionChartData,
  IndexingStatus,
  InternalTransaction,
  TransactionLog,
} from "@/lib/types/api";

// ============================================
// Blockscout v2 API Client
// ============================================

class BlockscoutClient {
  private baseUrl: string;

  constructor(baseUrl: string = BLOCKSCOUT_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async fetch<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), { next: { revalidate: 5 } });
    if (!res.ok) {
      throw new Error(`Blockscout API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  // --- Stats ---
  async getStats(): Promise<ChainStats> {
    return this.fetch("/stats");
  }

  async getTransactionCharts(): Promise<TransactionChartData> {
    return this.fetch("/stats/charts/transactions");
  }

  async getIndexingStatus(): Promise<IndexingStatus> {
    return this.fetch("/main-page/indexing-status");
  }

  // --- Blocks ---
  async getLatestBlocks(): Promise<Block[]> {
    const data = await this.fetch<PaginatedResponse<Block>>("/main-page/blocks");
    return data.items || (data as unknown as Block[]);
  }

  async getBlocks(params?: Record<string, string>): Promise<PaginatedResponse<Block>> {
    return this.fetch("/blocks", params);
  }

  async getBlock(numberOrHash: string | number): Promise<Block> {
    return this.fetch(`/blocks/${numberOrHash}`);
  }

  async getBlockTransactions(
    numberOrHash: string | number,
    params?: Record<string, string>
  ): Promise<PaginatedResponse<Transaction>> {
    return this.fetch(`/blocks/${numberOrHash}/transactions`, params);
  }

  // --- Transactions ---
  async getLatestTransactions(): Promise<Transaction[]> {
    const data = await this.fetch<PaginatedResponse<Transaction>>("/main-page/transactions");
    return data.items || (data as unknown as Transaction[]);
  }

  async getTransactions(params?: Record<string, string>): Promise<PaginatedResponse<Transaction>> {
    return this.fetch("/transactions", params);
  }

  async getTransaction(hash: string): Promise<Transaction> {
    return this.fetch(`/transactions/${hash}`);
  }

  async getTransactionLogs(
    hash: string,
    params?: Record<string, string>
  ): Promise<PaginatedResponse<TransactionLog>> {
    return this.fetch(`/transactions/${hash}/logs`, params);
  }

  async getTransactionInternalTxs(
    hash: string,
    params?: Record<string, string>
  ): Promise<PaginatedResponse<InternalTransaction>> {
    return this.fetch(`/transactions/${hash}/internal-transactions`, params);
  }

  async getTransactionRawTrace(hash: string): Promise<unknown> {
    return this.fetch(`/transactions/${hash}/raw-trace`);
  }

  async getTransactionStateChanges(hash: string): Promise<unknown> {
    return this.fetch(`/transactions/${hash}/state-changes`);
  }

  // --- Addresses ---
  async getAddress(hash: string): Promise<Address> {
    return this.fetch(`/addresses/${hash}`);
  }

  async getAddressTransactions(
    hash: string,
    params?: Record<string, string>
  ): Promise<PaginatedResponse<Transaction>> {
    return this.fetch(`/addresses/${hash}/transactions`, params);
  }

  async getAddressTokenBalances(hash: string): Promise<unknown[]> {
    return this.fetch(`/addresses/${hash}/token-balances`);
  }

  async getAddressCounters(hash: string): Promise<Record<string, string>> {
    return this.fetch(`/addresses/${hash}/counters`);
  }

  // --- Tokens ---
  async getTokens(params?: Record<string, string>): Promise<PaginatedResponse<Token>> {
    return this.fetch("/tokens", params);
  }

  async getToken(hash: string): Promise<Token> {
    return this.fetch(`/tokens/${hash}`);
  }

  // --- Search ---
  async search(query: string): Promise<PaginatedResponse<SearchResult>> {
    return this.fetch("/search", { q: query });
  }

  async searchRedirect(query: string): Promise<{ parameter: string; redirect: boolean; type: string }> {
    return this.fetch("/search/check-redirect", { q: query });
  }

  // --- Health ---
  async health(): Promise<{ healthy: boolean }> {
    return this.fetch("/health");
  }
}

// Singleton
export const blockscout = new BlockscoutClient();
