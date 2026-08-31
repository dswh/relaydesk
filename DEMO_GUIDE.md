# SignalDesk facilitator guide

## Repository model

`main` is a passing reference implementation. Each `demo/...` branch introduces one bounded problem. Use `pnpm demo:start <slug>` to create a disposable worktree from a seed branch.

```text
main
  demo/docs-freshness
  demo/test-repair
  demo/incremental-migration
  demo/performance-budget
  demo/logging-coverage
  demo/production-error
  demo/product-evaluation
  demo/pr-watch
  demo/seo-experiment
```

## Demo map

| Slug | Pattern | Primary sensor | Recommended surface |
| --- | --- | --- | --- |
| `docs-freshness` | safe draft | `pnpm docs:check` | Codex normal chat |
| `test-repair` | gap-closing | `pnpm test` | Codex `/goal` |
| `incremental-migration` | cross-run batch | `pnpm migration:scan` | Scheduled task |
| `performance-budget` | measured optimization | `pnpm perf:test` | Codex `/goal` |
| `logging-coverage` | coverage audit | `pnpm logging:check` | Codex or Claude Code |
| `production-error` | event to repair | `pnpm errors:triage` | Codex normal chat |
| `product-evaluation` | scenario evaluation | `pnpm eval` | Codex `/goal` |
| `pr-watch` | clock and polling | CI plus `pnpm test` | Claude Code `/loop` |
| `seo-experiment` | slow learning | `pnpm seo:audit` | Scheduled task with human publish gate |

## Before a live session

1. Run `pnpm verify` on `main`.
2. Run `pnpm demo:doctor` on the seed branch you plan to use.
3. Create a fresh worktree with `pnpm demo:start <slug>`.
4. Open that exact worktree in the agent.
5. Keep a pre-recorded terminal and diff as a fallback.
6. Never depend on a live scheduler firing during the session.

## Resetting between rehearsals

Create another run worktree instead of cleaning the old one. Each run gets a unique name and preserves its evidence for comparison. Remove old worktrees later with normal Git worktree commands after confirming that their branches are no longer needed.

## What to inspect after every run

- Did the agent select one unit of work?
- Did an objective verifier reject or accept the change?
- Did it avoid forbidden files and side effects?
- Did `LOOP_STATE.md` explain the evidence and next step?
- Did the agent stop for the stated reason?
- How many review minutes did the output require?

