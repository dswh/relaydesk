# Loop contract: production error to local repair

## Goal

Triage the supplied fixture, reproduce the top safe issue, and repair at most one root cause.

## Run

1. Run `pnpm errors:triage` and record the top safe signature.
2. Ignore and escalate unsafe infrastructure, auth, billing, and credential issues.
3. Reproduce the safe issue locally with a failing regression test before editing product code.
4. Make the smallest repair.
5. Run the regression test, `pnpm verify`, and `pnpm security:scan`.
6. Record the signature, cause, diff, and evidence in `LOOP_STATE.md`.

## Limits

- Fix one issue only.
- Never write to production or external services.
- Stop after one verified repair, three failed attempts, or 25 minutes.
- Do not push, merge, or deploy.

