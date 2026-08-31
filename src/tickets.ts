import { normalizeCustomerEmail } from './customer.js'
import { auditEvent } from './logger.js'
import type { AuditSink, Priority, Ticket, TicketInput } from './types.js'

export const PUBLIC_API_VERSION = '2026-08'

export const PRIORITY_SLA_MINUTES: Record<Priority, number> = {
  urgent: 60,
  high: 240,
  normal: 1440,
}

const URGENT_PATTERN = /security|payment failed|outage|account takeover/i
const HIGH_PATTERN = /blocked|cannot sign in|data export/i

export function classifyPriority(input: Pick<TicketInput, 'subject' | 'message' | 'vip'>): Priority {
  const text = `${input.subject} ${input.message}`

  if (URGENT_PATTERN.test(text)) return 'urgent'
  if (input.vip || HIGH_PATTERN.test(text)) return 'high'
  return 'normal'
}

export function createTicket(input: TicketInput, sink?: AuditSink): Ticket {
  const startedAt = performance.now()
  const priority = classifyPriority(input)
  const ticket: Ticket = {
    id: input.id,
    subject: input.subject,
    message: input.message,
    customerEmail: normalizeCustomerEmail(input.customerEmail),
    priority,
    slaMinutes: PRIORITY_SLA_MINUTES[priority],
  }

  if (sink) {
    auditEvent(sink, 'ticket.created', {
      requestId: input.id,
      outcome: 'success',
      durationMs: Math.max(0, performance.now() - startedAt),
    })

    if (priority === 'urgent') {
      auditEvent(sink, 'ticket.escalated', {
        requestId: input.id,
        outcome: 'success',
        durationMs: Math.max(0, performance.now() - startedAt),
      })
    }
  }

  return ticket
}

export function docsFingerprint(): string {
  return [
    `api=${PUBLIC_API_VERSION}`,
    `urgent=${PRIORITY_SLA_MINUTES.urgent}`,
    `high=${PRIORITY_SLA_MINUTES.high}`,
    `normal=${PRIORITY_SLA_MINUTES.normal}`,
  ].join('|')
}

