# Critical paths and required events

| Critical path | Required event | Required safe fields |
| --- | --- | --- |
| Ticket creation | `ticket.created` | request ID, outcome, duration |
| Urgent escalation | `ticket.escalated` | request ID, outcome, duration |

Never record access tokens, customer email addresses, ticket message bodies, payment data, or personal data.

