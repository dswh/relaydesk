# RelayDesk architecture

## Current foundation

RelayDesk uses the Next.js App Router with a deliberate server and client boundary:

```text
Browser
  WorkspaceShell
    InboxWorkspace               interactive queue and composer state
    Customer, knowledge, analytics views
  Public help center             static articles and structured data
  Developer reference            OpenAPI-backed operation catalog

Next.js server
  Server Components             product reads
  Route Handlers                external HTTP contract
  Domain modules                queue filtering, SLA state, summaries
  Grounded reply module         prompt, approved evidence, AI Gateway

Evaluation layer
  Redocly + openapi-typescript  contract and generated-type freshness
  Promptfoo                     reply and answer-quality scorecards
  Playwright + Lighthouse       crawlability, schema, accessibility, SEO

PostgreSQL
  organizations, customers, tickets, full-text search, queue indexes

Development fallback
  small synthetic ticket set for builds without DATABASE_URL
```

The inbox Server Component reads a lightweight queue projection from PostgreSQL. It loads the first complete conversation for initial rendering, while later ticket selections use the public ticket-detail contract. Search is driven by URL parameters, so the Server Component remains the source of queue reads. PostgreSQL uses a pooled connection, a generated `tsvector`, a GIN search index, queue-oriented composite indexes, and a five-second summary cache.

The repository can build without database credentials by using a seven-ticket synthetic fallback. The k6 performance gate checks the `X-RelayDesk-Data-Source` response header, so the fallback can never create a false performance pass.

Grounded reply generation uses Vercel AI SDK with the AI Gateway global provider when `AI_GATEWAY_API_KEY` is configured. Credential-free development returns the approved synthetic reply fixture with the same citation response shape. Promptfoo evaluates five frozen conversations with separate prompt-integrity, policy, citation, required-action, and helpfulness metrics. The live mode invokes a pinned model and blinded judge without changing the deterministic gates.

The public API contract lives in `openapi/relaydesk.openapi.json`. Redocly validates the specification, openapi-typescript generates `src/lib/relaydesk-api.d.ts`, and AJV checks real Route Handler responses with additional properties rejected. The developer reference imports the same contract, so operation names and descriptions cannot drift independently.

Public help articles are server-rendered from a shared knowledge corpus. Sitemap, robots policy, TechArticle structured data, canonical URLs, and `llms.txt` are generated from that corpus. Playwright verifies crawlability and links, Promptfoo measures answer and citation coverage, and Lighthouse enforces the public quality budgets.

## Target production boundaries

```text
apps/web
  agent console, customer portal, help center

services/api
  public API, channel webhooks, background jobs

packages/domain
  tickets, customers, SLAs, knowledge, audit events

packages/ai
  retrieval, model gateway, policies, citations

packages/evaluations
  scenario dataset, graders, regression reports

packages/observability
  structured logs, traces, metrics, error reporting

PostgreSQL
  tenant data, messages, generated full-text search vectors, knowledge, audit history
```

The repository will evolve toward these boundaries as persistence and integrations are implemented. We will extract packages only when the working product creates a real ownership or dependency boundary.

## Engineering rules

- `main` must remain runnable and deployable.
- Domain rules cannot depend on React or Next.js.
- Server Components read application data directly.
- UI mutations use Server Actions when they are internal to RelayDesk.
- Route Handlers exist for external clients, integrations, and webhooks.
- Every production failure correction adds a regression sensor at the nearest useful layer.
- Customer content in Git is synthetic and must not contain secrets or personal information.
