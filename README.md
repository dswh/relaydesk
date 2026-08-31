# RelayDesk

RelayDesk is an AI customer support operations platform for teams that need fast, accurate, and accountable service. It combines a working team inbox, customer context, approved knowledge, operational analytics, and grounded reply assistance in one product.

This repository is the product. Workshop scenarios are derived from real product surfaces only after the corresponding feature is working on `main`.

## Current product surface

- Searchable and filterable support inbox
- Ticket priority, ownership, status, tags, and first-response SLA tracking
- Customer profiles with account health and relationship context
- Conversation briefs and source-grounded response suggestions
- Reply and internal-note workflows
- Knowledge health and article freshness views
- Service performance and AI answer-quality analytics
- Read-only ticket API and service health endpoint
- Responsive desktop and mobile layouts

The first foundation release uses a synthetic Northstar Labs workspace so the application runs without credentials. PostgreSQL persistence, authentication, ingestion channels, and model-provider integrations are the next implementation milestones.

## Run locally

Requirements: Node.js 22 or newer and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000/inbox](http://localhost:3000/inbox).

## Verify the product

```bash
pnpm verify
```

The verification gate runs ESLint, strict TypeScript checks, domain tests, and a production Next.js build.

## Routes

| Route | Purpose |
| --- | --- |
| `/inbox` | Triage and respond to customer conversations |
| `/customers` | Review customer accounts, plan, health, and value |
| `/knowledge` | Manage approved content and freshness |
| `/analytics` | Track service performance and answer quality |
| `/settings` | Configure workspace-level behavior |
| `/api/tickets` | Read ticket queue data with query and filter parameters |
| `/api/health` | Report service availability |

## Repository model

`main` is the deployable RelayDesk product. Normal work happens on `codex/` branches and enters `main` only after verification.

Workshop scenario branches are frozen, believable product states. They are never the product architecture and they never replace `main`. Each scenario documents a customer or engineering impact, a measurable sensor, a bounded loop contract, and an objective stop condition.

Read [docs/PRODUCT.md](docs/PRODUCT.md) for product scope, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical boundaries, and [docs/WORKSHOP_SCENARIOS.md](docs/WORKSHOP_SCENARIOS.md) for the planned loop demonstrations.
