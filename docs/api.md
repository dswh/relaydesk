# SignalDesk public API

<!-- public-api-fingerprint: api=2026-08|urgent=60|high=240|normal=1440 -->

## `createTicket(input, sink?)`

Creates a normalized support ticket.

Priority SLAs:

| Priority | Response target |
| --- | ---: |
| Urgent | 60 minutes |
| High | 240 minutes |
| Normal | 1440 minutes |

The optional audit sink receives `ticket.created`. Urgent tickets also emit `ticket.escalated`.

Invalid or empty customer email values are rejected with `INVALID_CUSTOMER_EMAIL`. Message bodies and email addresses are never included in audit events.

