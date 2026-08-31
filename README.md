# SignalDesk Loop Lab

SignalDesk is a small TypeScript support-ticket system designed for teaching loop engineering. It includes deterministic sensors, seeded defects, loop contracts, persistent state, and disposable Git worktrees.

The `main` branch is the healthy reference system. Every `demo/...` branch contains exactly one prepared scenario. Do not fix a seed branch directly.

## Quick start

```bash
pnpm install
pnpm verify
pnpm demo:list
pnpm demo:start docs-freshness
```

`pnpm demo:start <slug>` creates:

- an isolated worktree under `.worktrees/`;
- a disposable branch named `run/<slug>-<timestamp>`;
- a clean copy of the selected seeded defect.

Open the printed worktree path in Codex or Claude Code. Read `SCENARIO.md`, then launch the contract under `loops/`.

## Recommended workshop sequence

1. `docs-freshness`: safe draft loop in a normal agent turn.
2. `test-repair`: verifier-driven repair using Codex `/goal`.
3. `pr-watch`: polling an external pull request using Claude Code `/loop`.
4. `incremental-migration`: one unit per scheduled run.
5. `production-error`: triage, reproduce, repair, and hand off.

See `DEMO_GUIDE.md` for facilitator instructions and the complete branch map.

## Core commands

```bash
pnpm test
pnpm typecheck
pnpm docs:check
pnpm perf:test
pnpm migration:scan
pnpm logging:check
pnpm errors:triage
pnpm eval
pnpm security:scan
pnpm seo:audit
pnpm verify
```

## Safety model

- Seed branches are immutable starting points.
- Run branches are disposable.
- Sensors are deterministic and local.
- Every contract has hard stop conditions.
- Outputs remain local until a human approves a push or pull request.

