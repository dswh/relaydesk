# Loop contract: SEO experiment

## Goal

Run one measured help-center improvement cycle with a human publish gate.

## Run

1. Read `analytics/search-console.csv`, the current page, and `LOOP_STATE.md`.
2. Choose one query, one page, and one hypothesis.
3. Draft the smallest content or technical change.
4. Run `pnpm seo:audit`, `pnpm test`, and `pnpm security:scan`.
5. Record the hypothesis, baseline, change, evaluation date, and later result.

## Limits

- One experiment per cycle.
- Never invent claims or mass-create pages.
- Ask for approval before publishing.
- Stop after one reviewable draft or 25 minutes.

