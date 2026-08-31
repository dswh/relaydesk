import { buildTicketIndex, findTicketById } from '../src/search.js'
import type { Ticket } from '../src/types.js'

const tickets: Ticket[] = Array.from({ length: 2_000 }, (_, index) => ({
  id: `ticket-${index}`,
  subject: `Subject ${index}`,
  message: `Message ${index}`,
  customerEmail: `person-${index}@example.com`,
  priority: 'normal',
  slaMinutes: 1440,
}))

const target = 'ticket-1999'
const result = findTicketById(buildTicketIndex(tickets), target)
const operationBudget = 10

console.log(`Search target: ${target}`)
console.log(`Operations used: ${result.operations}`)
console.log(`Operation budget: ${operationBudget}`)

if (result.ticket?.id !== target) {
  console.error('Performance check failed: target ticket was not found')
  process.exitCode = 1
} else if (result.operations > operationBudget) {
  console.error('Performance budget failed')
  process.exitCode = 1
} else {
  console.log('Performance budget passed')
}

