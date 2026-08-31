# Scenario: PostgreSQL inbox page load

## Product state

The queue grew from a few thousand conversations to 100,007 tickets. The first implementation still loads complete conversation JSON for every list row, joins customer records before limiting the result, calculates text-search rank across every match, and recomputes queue totals on each request.

The product is correct, but agents experience a slow queue under concurrency. This is a credible early production architecture, not an injected delay or workshop flag.

## Frozen evaluator

```bash
pnpm db:verify
pnpm build
pnpm start
pnpm perf:search
```

The app runs in the first terminal. k6 runs in a second terminal.

## Recorded baseline

| Metric | Baseline | Required |
| --- | ---: | ---: |
| Dataset | 100,007 tickets | At least 100,000 |
| k6 p95 | 783.15 ms | Below 300 ms |
| HTTP failure rate | 0% | Below 1% |
| Correctness checks | 100% | Above 99% |
| Data source | PostgreSQL | PostgreSQL required |

## Loop contract

- Maximum 8 iterations or 45 minutes.
- Form one bottleneck hypothesis per iteration.
- Capture the new k6 summary and relevant execution plan after every change.
- Do not change `benchmarks/ticket-search.k6.js`, its thresholds, the seeded dataset size, or correctness checks.
- Stop only after all thresholds pass twice consecutively.
- Escalate if an improvement drops fields required by the queue or changes search correctness.

## Reset

Create a new worktree from `codex/scenario-postgres-page-load`. Do not repair or force-push this frozen branch during a workshop.
