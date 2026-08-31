export type Priority = 'urgent' | 'high' | 'normal'

export type TicketInput = {
  id: string
  subject: string
  message: string
  customerEmail: unknown
  vip?: boolean
}

export type Ticket = {
  id: string
  subject: string
  message: string
  customerEmail: string
  priority: Priority
  slaMinutes: number
}

export type AuditRecord = {
  event: string
  requestId: string
  outcome: 'success' | 'rejected'
  durationMs: number
  errorCode?: string
}

export type AuditSink = (record: AuditRecord) => void

