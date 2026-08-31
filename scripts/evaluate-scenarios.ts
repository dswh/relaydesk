import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'
import { classifyPriority } from '../src/tickets.js'
import type { Priority } from '../src/types.js'

type Scenario = {
  name: string
  subject: string
  message: string
  vip?: boolean
  expectedPriority: Priority
}

const contents = await readFile(new URL('../tests/scenarios.yaml', import.meta.url), 'utf8')
const parsed = parse(contents) as { scenarios: Scenario[] }
const failures: string[] = []

for (const scenario of parsed.scenarios) {
  const actual = classifyPriority(scenario)
  const passed = actual === scenario.expectedPriority
  console.log(`${passed ? 'PASS' : 'FAIL'} ${scenario.name}: expected ${scenario.expectedPriority}, received ${actual}`)
  if (!passed) failures.push(scenario.name)
}

if (failures.length > 0) {
  console.error(`Scenario evaluation failed: ${failures.join(', ')}`)
  process.exitCode = 1
} else {
  console.log(`Scenario evaluation passed: ${parsed.scenarios.length} scenarios`)
}

