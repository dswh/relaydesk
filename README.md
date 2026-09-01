# RelayDesk

RelayDesk is an AI customer support operations platform for teams that need fast, accurate, and accountable service. It combines a working team inbox, customer context, approved knowledge, operational analytics, and grounded reply assistance in one product.

This repository is the product. Workshop scenarios are derived from real product surfaces only after the corresponding feature is working on `main`.

## Current product surface

- Searchable and filterable support inbox
- Ticket priority, ownership, status, tags, and first-response SLA tracking
- Customer profiles with account health and relationship context
- Conversation briefs and source-grounded response suggestions through Vercel AI SDK and AI Gateway
- Reply and internal-note workflows
- Knowledge health and article freshness views
- Service performance and AI answer-quality analytics
- OpenAPI 3.1 ticket API, generated TypeScript contract, executable example, and developer reference
- Responsive desktop and mobile layouts
- PostgreSQL-backed queue search with a 100,000-ticket development dataset
- Public RelayDesk product site, eight long-form field notes, and five-article help center with enforced Lighthouse budgets
- Promptfoo evaluation suites for grounded replies and public answer visibility

The Northstar Labs workspace is fully synthetic. PostgreSQL is used when `DATABASE_URL` is configured. A small in-memory dataset remains available for credential-free builds and product previews, but the performance verifier rejects that fallback.

## Run locally

Requirements: Node.js 22 or newer, pnpm 10, and Docker Desktop.

```bash
pnpm install
cp .env.example .env.local
pnpm db:setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site or [http://localhost:3000/inbox](http://localhost:3000/inbox) for the support workspace.

`pnpm db:seed` replaces only the synthetic `northstar-labs` workspace and creates 100,007 tickets. The local PostgreSQL container listens on port 5433 so it does not conflict with a default PostgreSQL installation.

## Verify the product

```bash
pnpm verify
```

The verification gate runs ESLint, strict TypeScript checks, OpenAPI validation, generated-type freshness, domain and contract tests, deterministic Promptfoo suites, and a production Next.js build.

## Run the measurable loop gates

Start the production app in one terminal:

```bash
pnpm build
pnpm start
```

Run the PostgreSQL load gate in a second terminal:

```bash
pnpm db:verify
pnpm perf:search
```

The load gate uses Grafana k6 in Docker, runs 10 concurrent users for 30 seconds, requires p95 below 300 ms, and rejects non-PostgreSQL responses.

Run the complete multi-page public-site quality gate:

```bash
pnpm eval:lighthouse-showcase
```

The gate builds the production site, validates all eight field notes with Playwright, then performs two Lighthouse runs each on the landing page, blog index, and representative long-form article. It requires 1.00 in accessibility, best practices, and SEO, at least 0.95 in performance, plus fixed Core Web Vitals budgets.

Run the remaining showcase evaluators independently:

```bash
pnpm eval:api-docs
pnpm eval:ai-replies
pnpm eval:help-center
```

The grounded-reply gate works without credentials against frozen approved fixtures. Add `AI_GATEWAY_API_KEY` to `.env.local`, then run `pnpm eval:ai-replies:live` to enable live generation and the blinded LLM judge. Secrets are never committed.

## Routes

| Route | Purpose |
| --- | --- |
| `/inbox` | Triage and respond to customer conversations |
| `/` | Public RelayDesk product site |
| `/customers` | Review customer accounts, plan, health, and value |
| `/knowledge` | Manage approved content and freshness |
| `/help` | Browse the public RelayDesk help center |
| `/help/:slug` | Read a server-rendered, structured help article |
| `/blog` | Browse eight long-form support operations field notes |
| `/blog/:slug` | Read a server-rendered BlogPosting with a table of contents and related guidance |
| `/developers/api` | Review the public API contract and TypeScript example |
| `/analytics` | Track service performance and answer quality |
| `/settings` | Configure workspace-level behavior |
| `/api/tickets` | Read lightweight ticket queue data with query and filter parameters |
| `/api/tickets/:id` | Read a complete ticket conversation and grounding context |
| `/api/tickets/:id/suggested-reply` | Generate a reply from the ticket's approved grounding sources |
| `/api/health` | Report service availability |
| `/openapi.json` | Download the OpenAPI 3.1 contract |
| `/llms.txt` | Discover public RelayDesk guidance for answer engines |

## Repository model

`main` is the deployable RelayDesk product. Normal work happens on `codex/` branches and enters `main` only after verification.

Workshop scenario branches are frozen, believable product states. They are never the product architecture and they never replace `main`. Each scenario documents a customer or engineering impact, a measurable sensor, a bounded loop contract, and an objective stop condition.

Read [docs/PRODUCT.md](docs/PRODUCT.md) for product scope, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical boundaries, and [docs/WORKSHOP_SCENARIOS.md](docs/WORKSHOP_SCENARIOS.md) for the planned loop demonstrations.

The print-friendly instructor version is available at [`/loop-runbook.html`](public/loop-runbook.html) when the app is running.
