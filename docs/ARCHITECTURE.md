# KiteAI Explorer — Architecture

## Overview

Custom block explorer for KiteAI Mainnet (Chain ID: 2366).
Uses **Blockscout as the backend/indexer** and a **custom Next.js frontend** for premium UI/UX.

## Stack

```
┌─────────────────────────────────────┐
│         Custom Frontend             │
│   Next.js + TypeScript + Tailwind   │
│   shadcn/ui + Recharts              │
│         Port 3000                   │
└──────────────┬──────────────────────┘
               │ REST API v2 / GraphQL
               ▼
┌─────────────────────────────────────┐
│       Blockscout Backend            │
│   Elixir Indexer + API Server       │
│         Port 4000                   │
│   ┌───────────┐  ┌──────────────┐   │
│   │  Indexer   │  │  REST API v2 │   │
│   │  (blocks,  │  │  /api/v2/*   │   │
│   │   txs,     │  ├──────────────┤   │
│   │   logs,    │  │  GraphQL     │   │
│   │   tokens)  │  │  /graphiql   │   │
│   └─────┬─────┘  └──────────────┘   │
│         │                           │
│   ┌─────▼─────┐                     │
│   │ PostgreSQL │                     │
│   │  Port 7432 │                     │
│   └───────────┘                     │
└──────────────┬──────────────────────┘
               │ JSON-RPC (HTTP + WS)
               ▼
┌─────────────────────────────────────┐
│     KiteAI Archive Node            │
│   Avalanche Subnet-EVM (v0.8.0)    │
│   Chain ID: 2366 | Token: KITE     │
│   HTTP RPC: Port 9650              │
│   P2P: Port 9651                   │
│   pruning-enabled: false           │
└─────────────────────────────────────┘
```

## Chain Details

| Parameter           | Value |
|---------------------|-------|
| Chain Name          | KiteAI Mainnet |
| Chain ID            | 2366 |
| Token               | KITE (18 decimals) |
| Architecture        | Avalanche L1 (Subnet-EVM) |
| Consensus           | Proof of Attributed Intelligence (PoAI) |
| Block Time           | ~2 seconds |
| RPC (Public)        | `https://rpc.gokite.ai` |
| WSS (Public)        | `wss://rpc.gokite.ai/ws` |
| Blockchain ID       | `3USaEfTcoUhHxpKXvpAG916UKCUEyjrtkg2hBArBG3JyDP7my` |
| Subnet ID           | `21uUaTxVdR3Sp6SJhpcSrdH1g66aFoE8mPQDvwKJCjXNexo5y6` |
| Existing Explorer   | `https://kitescan.ai` (Blockscout) |

## Data Flow

1. **Archive Node** syncs all KiteAI blocks with `pruning-enabled: false`
2. **Blockscout Indexer** polls the node via JSON-RPC, indexes into Postgres
3. **Blockscout API** serves indexed data via REST v2 + GraphQL
4. **Custom Frontend** fetches from Blockscout API, renders premium UI

## Key Blockscout API Endpoints

### Dashboard Data
- `GET /api/v2/stats` — network stats, gas prices
- `GET /api/v2/main-page/blocks` — latest blocks
- `GET /api/v2/main-page/transactions` — latest transactions
- `GET /api/v2/main-page/indexing-status` — sync progress
- `GET /api/v2/stats/charts/transactions` — tx chart data

### Detail Pages
- `GET /api/v2/blocks/{number}` — block detail
- `GET /api/v2/transactions/{hash}` — tx detail
- `GET /api/v2/addresses/{hash}` — address detail
- `GET /api/v2/tokens` — token list
- `GET /api/v2/smart-contracts/{hash}` — verified contracts
- `GET /api/v2/search` — universal search

### Transaction Deep-Dive
- `GET /api/v2/transactions/{hash}/logs` — event logs
- `GET /api/v2/transactions/{hash}/internal-transactions` — internal txs
- `GET /api/v2/transactions/{hash}/raw-trace` — execution trace
- `GET /api/v2/transactions/{hash}/state-changes` — state diff
- `GET /api/v2/transactions/{hash}/token-transfers` — token movements

## KiteAI-Specific Features for Explorer

These differentiate us from generic Blockscout:

1. **Agent Identity Resolution** — Kite Passport tiers (User / Agent / Session)
2. **PoAI Attribution** — Contribution scores, rewards distribution
3. **A2A Transaction Labels** — Agent-initiated vs human-initiated
4. **AI Model/Data Tracking** — On-chain attribution events
5. **Delegation Visualization** — User → Agent → Session chains
6. **Stablecoin Micropayment Flows** — USDC A2A patterns

## Frontend Pages

| Page | Route | Priority |
|------|-------|----------|
| Dashboard | `/` | P0 |
| Blocks List | `/blocks` | P0 |
| Block Detail | `/block/[number]` | P0 |
| Transactions List | `/txs` | P0 |
| Transaction Detail | `/tx/[hash]` | P0 |
| Address Detail | `/address/[hash]` | P0 |
| Token List | `/tokens` | P1 |
| Token Detail | `/token/[hash]` | P1 |
| Contract Detail | `/address/[hash]#code` | P1 |
| Search Results | `/search` | P0 |
| Charts & Stats | `/stats` | P2 |
| API Docs | `/api-docs` | P2 |

## Design System

- **Theme**: Dark, warm gold/bronze palette (#C4A96A, #DBC993, #8B7A4E)
- **Background**: Warm blacks (#09090B, #111113)
- **Typography**: Outfit (UI) + JetBrains Mono (data/code)
- **Components**: shadcn/ui base, custom styled
- **Charts**: Recharts with gradient fills
- **Responsive**: Mobile-first
