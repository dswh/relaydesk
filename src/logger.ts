import type { AuditRecord, AuditSink } from './types.js'

export function createMemorySink(records: AuditRecord[]): AuditSink {
  return (record) => records.push(record)
}

export function auditEvent(
  sink: AuditSink,
  event: string,
  fields: Omit<AuditRecord, 'event'>,
): void {
  sink({ event, ...fields })
}

