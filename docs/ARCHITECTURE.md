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

Development dataset
  Synthetic tickets and customers
```

The inbox receives serializable ticket data from a Server Component. Interactive selection, filtering, assignment, resolution, and composing live inside the client workspace. Public API reads use Route Handlers, while domain rules stay framework-independent and unit tested.

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

PostgreSQL and search index
  tenant data, messages, knowledge, audit history
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
