import { describe, expect, it } from 'vitest'
import { classifyPriority, createTicket } from '../src/tickets.js'

describe('ticket priority', () => {
  it('marks a security issue as urgent', () => {
    expect(classifyPriority({ subject: 'Security alert', message: 'Unknown login' })).toBe('urgent')
  })

  it('marks a VIP request as high priority', () => {
    expect(classifyPriority({ subject: 'Question', message: 'Need an update', vip: true })).toBe('high')
  })

  it('keeps ordinary questions at normal priority', () => {
    expect(classifyPriority({ subject: 'How do I export?', message: 'Just learning the product' })).toBe('normal')
  })

  it('assigns the documented SLA', () => {
    const ticket = createTicket({
      id: 'ticket-1',
      subject: 'Security problem',
      message: 'Please help',
      customerEmail: 'person@example.com',
    })

    expect(ticket.slaMinutes).toBe(60)
  })
})

