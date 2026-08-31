# Loop contract: documentation freshness

## Goal

Every changed public behavior has a matching documentation update or a written reason that no update is needed.

## Run

1. Read `SCENARIO.md`, `LOOP_STATE.md`, and the Git diff from `main`.
2. List changed public behavior before editing.
3. Update only stale documentation and examples.
4. Run `pnpm docs:check`, `pnpm test`, and `pnpm typecheck`.
5. Record the files inspected, files changed, commands, and evidence in `LOOP_STATE.md`.

## Limits

- Never change product code or verifier scripts.
- Stop after three attempts or 20 minutes.
- Stop after a small passing documentation diff.
- Do not push, merge, or publish.

