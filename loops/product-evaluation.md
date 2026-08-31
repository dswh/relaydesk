# Loop contract: product evaluation

## Goal

Make every fixed scenario in `tests/scenarios.yaml` pass without lowering the rubric.

## Run

1. Run `pnpm eval` under unchanged conditions.
2. Save pass or fail evidence for every scenario.
3. Select the smallest shared root cause.
4. Make one scoped product change.
5. Rerun the affected evaluation, then `pnpm verify`.
6. Update `LOOP_STATE.md`.

## Limits

- Never edit, delete, or weaken a scenario.
- Stop when all scenarios pass, after three attempts, after 25 minutes, or when the same failure repeats twice.
- Do not expand the scenario suite during repair.

