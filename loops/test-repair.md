# Loop contract: verifier-driven repair

## Goal

Make the failing ticket behavior pass without changing its public contract.

## Run

1. Run `pnpm test` and save the exact baseline failure.
2. Identify the smallest root cause.
3. Make one scoped product-code change.
4. Rerun the affected test, then `pnpm verify`.
5. Update `LOOP_STATE.md` after every attempt.

## Limits

- Never edit, delete, skip, or weaken a test.
- Stop on success, after three failed repairs, after 20 minutes, or when the same failure repeats twice.
- Do not perform unrelated cleanup.
- Do not push or merge.

