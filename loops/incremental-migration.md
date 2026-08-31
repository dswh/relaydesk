# Loop contract: incremental migration

## Program goal

Reach zero legacy logging violations without changing public behavior.

## Per-run goal

Migrate exactly one coherent legacy logging call per run.

## Run

1. Run `pnpm migration:scan` and record the ordered baseline.
2. Select the first smallest violation.
3. Follow `docs/migration-patterns.md`.
4. Run `pnpm typecheck`, `pnpm test`, `pnpm security:scan`, and `pnpm migration:scan`.
5. Confirm that the violation count decreased and update `LOOP_STATE.md`.

## Limits

- Change one call site only.
- Never edit the scanner or golden example.
- Stop after one accepted migration, 20 minutes, or two repeated failures.
- If an earlier migration run awaits review, stop without changes.

