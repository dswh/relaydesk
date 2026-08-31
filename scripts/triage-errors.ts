import { readFile } from 'node:fs/promises'

type ErrorEvent = {
  id: string
  signature: string
  message: string
  path: string
  safe: boolean
}

const input = process.argv[2]
if (!input) throw new Error('Usage: pnpm errors:triage <error-fixture>')

const events = JSON.parse(await readFile(input, 'utf8')) as ErrorEvent[]
const groups = new Map<string, { count: number; safe: boolean; path: string }>()

for (const event of events) {
  const group = groups.get(event.signature) ?? { count: 0, safe: event.safe, path: event.path }
  group.count += 1
  group.safe = group.safe && event.safe
  groups.set(event.signature, group)
}

const ranked = [...groups.entries()].sort((left, right) => {
  const frequency = right[1].count - left[1].count
  return frequency === 0 ? left[0].localeCompare(right[0]) : frequency
})

for (const [signature, group] of ranked) {
  console.log(`${group.safe ? 'ACTIONABLE' : 'ESCALATE'} count=${group.count} path=${group.path} signature=${signature}`)
}

const topSafe = ranked.find(([, group]) => group.safe)
if (topSafe) console.log(`TOP_SAFE_ISSUE=${topSafe[0]}`)
else console.log('TOP_SAFE_ISSUE=none')

