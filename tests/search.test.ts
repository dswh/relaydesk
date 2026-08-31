import { describe, expect, it } from 'vitest'
import { buildTicketIndex, findTicketById } from '../src/search.js'
import type { Ticket } from '../src/types.js'

const tickets: Ticket[] = [
  {
    id: 'ticket-1',
    subject: 'Example',
    message: 'Example',
    customerEmail: 'person@example.com',
    priority: 'normal',
    slaMinutes: 1440,
  },
]

describe('ticket search', () => {
  it('finds an indexed ticket', () => {
    const result = findTicketById(buildTicketIndex(tickets), 'ticket-1')
    expect(result.ticket?.id).toBe('ticket-1')
    expect(result.operations).toBe(1)
  })
})

