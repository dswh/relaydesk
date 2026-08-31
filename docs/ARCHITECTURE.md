# RelayDesk architecture

## Current foundation

RelayDesk uses the Next.js App Router with a deliberate server and client boundary:

```text
Browser
  WorkspaceShell
    InboxWorkspace               interactive queue and composer state
    Customer, knowledge, analytics views

Next.js server
  Server Components             product reads
  Route Handlers                external HTTP contract
  Domain modules                queue filtering, SLA state, summaries

PostgreSQL
  organizations, customers, tickets, full-text search, queue indexes

Development fallback
  small synthetic ticket set for builds without DATABASE_URL
```

The inbox Server Component reads a lightweight queue projection from PostgreSQL. It loads the first complete conversation for initial rendering, while later ticket selections use the public ticket-detail contract. Search is driven by URL parameters, so the Server Component remains the source of queue reads. PostgreSQL uses a pooled connection, a generated `tsvector`, a GIN search index, queue-oriented composite indexes, and a five-second summary cache.

The repository can build without database credentials by using a seven-ticket synthetic fallback. The k6 performance gate checks the `X-RelayDesk-Data-Source` response header, so the fallback can never create a false performance pass.

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
