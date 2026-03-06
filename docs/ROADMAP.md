# KiteAI Explorer — Roadmap

## Sprint 1: Infrastructure (Week 1)

- [x] Research Blockscout architecture and API
- [x] Research KiteAI chain specifics
- [x] Set up archive node (pruning-enabled: false)
- [x] Create project scaffold
- [ ] Deploy Blockscout backend pointing to KiteAI archive node
- [ ] Verify indexing works (blocks, txs, logs, tokens)
- [ ] Verify API responses from `/api/v2/stats`, `/api/v2/blocks`, etc.

## Sprint 2: Frontend Foundation (Week 2)

- [ ] Initialize Next.js 14+ with TypeScript, Tailwind, shadcn/ui
- [ ] Set up API adapter layer (typed clients for Blockscout REST v2)
- [ ] Build layout: navbar, footer, search bar
- [ ] Build Dashboard page:
  - [ ] Chain overview stat strip (block height, TPS, gas, addresses)
  - [ ] Latest Blocks panel
  - [ ] Latest Transactions panel
  - [ ] Transaction Activity chart (area chart)
  - [ ] Gas Utilization chart
  - [ ] Active Contracts leaderboard
- [ ] Wallet connect (RainbowKit + wagmi + viem)

## Sprint 3: Core Pages (Week 3)

- [ ] Blocks list page (paginated)
- [ ] Block detail page (txs, gas, validator)
- [ ] Transactions list page (paginated, filterable)
- [ ] Transaction detail page:
  - [ ] Overview tab
  - [ ] Internal txs tab
  - [ ] Logs tab
  - [ ] State changes tab
  - [ ] Raw trace tab
- [ ] Search results page (universal search)

## Sprint 4: Address & Token Pages (Week 4)

- [ ] Address detail page:
  - [ ] Balance, tx count, token holdings
  - [ ] Transaction history tab
  - [ ] Token transfers tab
  - [ ] Internal txs tab
  - [ ] Contract code tab (if verified)
- [ ] Token list page
- [ ] Token detail page (holders, transfers)
- [ ] Contract detail page (ABI, read/write, verification status)

## Sprint 5: KiteAI-Specific Features (Week 5-6)

- [ ] Agent identity badges (User / Agent / Session tier)
- [ ] PoAI attribution scores display
- [ ] A2A transaction labeling
- [ ] AI contribution tracking dashboard
- [ ] Delegation chain visualization
- [ ] Custom chart: Agent activity over time

## Sprint 6: Polish & Deploy (Week 6-7)

- [ ] Loading/skeleton/error/empty states
- [ ] Mobile responsive optimization
- [ ] SEO: meta tags, OpenGraph, structured data
- [ ] Performance: ISR, caching, pagination optimization
- [ ] Reverse proxy (nginx/caddy) + SSL
- [ ] Rate limiting
- [ ] Monitoring + error tracking
- [ ] Production deployment

## Non-Goals (for now)

- Custom indexer (use Blockscout)
- Contract verification UI (use Blockscout's built-in)
- User accounts / saved addresses
- Multi-chain support
