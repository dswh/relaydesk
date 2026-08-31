import type { Ticket } from './types.js'

export type SearchResult = {
  ticket: Ticket | undefined
  operations: number
}

export function buildTicketIndex(tickets: Ticket[]): Map<string, Ticket> {
  return new Map(tickets.map((ticket) => [ticket.id, ticket]))
}

export function findTicketById(index: Map<string, Ticket>, id: string): SearchResult {
  return {
    ticket: index.get(id),
    operations: 1,
  }
}

