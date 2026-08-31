# API documentation contract freshness baseline

## Workshop starting state

The list endpoint returns `meta.source` and `meta.durationMs`, but the frozen OpenAPI contract does not describe either field. The contract itself is valid and generated TypeScript is current, so the failure isolates a realistic documentation drift problem rather than a broken toolchain.

## Reproduce

```bash
pnpm eval:api-docs
```

The command was run three times before this branch was published. Every run produced the same result:

- Redocly contract lint: pass
- Generated type freshness: pass
- Runtime contract tests: 4 pass, 1 fail
- Failed gate: `strictly matches the list response`
- Undocumented response fields: `source`, `durationMs`

## Loop contract

1. Run `pnpm eval:api-docs` and read the exact AJV failure.
2. Inspect the runtime payload, OpenAPI contract, generated type, example, and developer reference.
3. Make one bounded contract or implementation change.
4. Run the evaluator again.
5. Stop only when Redocly, generated-type freshness, all 5 runtime contract tests, and the production build pass.

Do not weaken `additionalProperties: false`, skip the failing response, or delete the runtime fields merely to make the test green. The final contract must accurately describe the useful production response.

## Why this is a strong loop

The evaluator reports an exact mismatch, the repair surface is bounded, and every iteration yields a binary result. The audience sees an agent reconcile code, an industry-standard API contract, generated types, executable examples, and public documentation as one system.
