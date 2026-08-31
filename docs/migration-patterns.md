# Logging migration pattern

Legacy calls from `src/legacy-logger.ts` must be replaced one unit at a time.

Approved pattern:

```ts
auditEvent(sink, 'ticket.created', {
  requestId,
  outcome: 'success',
  durationMs,
})
```

Run `pnpm migration:scan` to find remaining legacy imports and calls. Do not edit the scanner during a migration.

