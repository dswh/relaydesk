# Loop contract: performance budget

## Goal

Find ticket `ticket-1999` within the deterministic operation budget while preserving behavior.

## Run

1. Run `pnpm perf:test` and record the baseline operation count.
2. Identify the smallest algorithmic cause.
3. Make one scoped change.
4. Run `pnpm perf:test`, `pnpm test`, and `pnpm typecheck`.
5. Keep the change only if operations improve and behavior remains correct.

## Limits

- Never raise or bypass the budget.
- Stop when the budget passes, after three attempts, or after 25 minutes.
- Do not perform unrelated optimization.

