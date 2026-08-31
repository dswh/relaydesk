import { describe, expect, it } from 'vitest'
import { createMemorySink } from '../src/logger.js'
import { createTicket } from '../src/tickets.js'
import type { AuditRecord } from '../src/types.js'

describe('critical-path logging', () => {
  it('records creation and escalation for urgent tickets', () => {
    const records: AuditRecord[] = []
    createTicket(
      {
        id: 'request-urgent-1',
        subject: 'Payment failed',
        message: 'Checkout is blocked',
        customerEmail: 'buyer@example.com',
      },
      createMemorySink(records),
    )

    expect(records.map((record) => record.event)).toEqual(['ticket.created', 'ticket.escalated'])
    expect(records.every((record) => record.requestId === 'request-urgent-1')).toBe(true)
    expect(records.every((record) => record.durationMs >= 0)).toBe(true)
  })
})

