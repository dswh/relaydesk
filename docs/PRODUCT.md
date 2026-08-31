# RelayDesk product brief

## Product thesis

Support teams should not have to choose between speed and accuracy. RelayDesk keeps the conversation, account context, operating policy, and approved knowledge close enough that an agent can make a good decision without opening five systems.

## Primary users

### Support agent

Needs to understand a customer quickly, produce an accurate response, and know what should happen next.

### Support lead

Needs to protect service levels, balance team load, spot quality problems, and improve the operating system behind the queue.

### Knowledge owner

Needs to keep public guidance and internal policy aligned with the product, APIs, and recurring customer questions.

### Developer or platform owner

Needs reliable integrations, traceable failures, stable APIs, and enough operational context to move from an incident to a verified correction.

## Core jobs

1. Triage incoming customer conversations by urgency, ownership, and SLA risk.
2. Understand the customer and conversation without searching across disconnected tools.
3. Draft responses from approved sources while keeping a human responsible for sending them.
4. Resolve, defer, assign, or annotate work with a clear audit trail.
5. Maintain knowledge as the product and recurring questions change.
6. Measure service performance and answer quality over time.

## Foundation scope

The foundation establishes the product language and its major working surfaces. It includes interactive queue operations, customer context, knowledge health, analytics, API routes, responsive UI, domain tests, and CI.

The synthetic Northstar Labs workspace is development data, not the product premise. It allows contributors to run and evaluate the product safely without copying real customer records into Git.

## Next milestones

1. PostgreSQL schema and repository implementation
2. Workspace authentication and role-based access
3. Email and chat ingestion
4. Persistent replies, assignments, status changes, and audit events
5. Search indexing and measured performance budgets
6. Model gateway, retrieval, citations, and evaluation suite
7. OpenTelemetry traces, production error capture, and alert routing
8. Public help center and TypeScript SDK
