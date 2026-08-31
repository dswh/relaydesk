# Loop contract: logging coverage

## Goal

Every critical path in `docs/critical-paths.md` emits its required structured event with safe fields.

## Run

1. Run `pnpm logging:check` and inspect the missing event.
2. Add the smallest useful event at the named path.
3. Run `pnpm logging:check`, `pnpm security:scan`, and `pnpm typecheck`.
4. Update `LOOP_STATE.md` with the event, fields, and proof.

## Limits

- Never log emails, message bodies, credentials, tokens, or payment data.
- Never weaken the critical-path test.
- Stop after one missing event is restored, three attempts, or 20 minutes.

