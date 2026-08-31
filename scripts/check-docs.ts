import { readFile } from 'node:fs/promises'
import { docsFingerprint } from '../src/tickets.js'

const documentation = await readFile(new URL('../docs/api.md', import.meta.url), 'utf8')
const marker = documentation.match(/<!-- public-api-fingerprint: (.+) -->/)?.[1]
const expected = docsFingerprint()

if (marker !== expected) {
  console.error('Documentation freshness check failed.')
  console.error(`Expected fingerprint: ${expected}`)
  console.error(`Documented fingerprint: ${marker ?? 'missing'}`)
  process.exitCode = 1
} else {
  console.log(`Documentation is current: ${expected}`)
}

