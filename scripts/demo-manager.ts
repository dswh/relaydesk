import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

type Preflight = {
  command: string
  expectedExit: number
  outputIncludes?: string
}

type Scenario = {
  slug: string
  title: string
  pattern: string
  contract: string | null
  preflight: Preflight[]
}

const demoBranches = [
  ['docs-freshness', 'Safe documentation draft'],
  ['test-repair', 'Verifier-driven repair'],
  ['incremental-migration', 'One unit per scheduled run'],
  ['performance-budget', 'Measured optimization'],
  ['logging-coverage', 'Critical-path observability'],
  ['production-error', 'Error triage to draft repair'],
  ['product-evaluation', 'Scenario evaluation and repair'],
  ['pr-watch', 'Session-scoped PR polling'],
  ['seo-experiment', 'Slow external learning'],
] as const

function run(command: string, cwd = process.cwd()) {
  return spawnSync(command, {
    cwd,
    encoding: 'utf8',
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  })
}

async function readScenario(): Promise<Scenario> {
  return JSON.parse(await readFile(resolve('demo/scenario.json'), 'utf8')) as Scenario
}

function list(): void {
  console.log('Available demo seeds:')
  for (const [slug, description] of demoBranches) {
    console.log(`- ${slug.padEnd(24)} ${description}`)
  }
}

function start(slug: string | undefined): void {
  if (!slug || !demoBranches.some(([candidate]) => candidate === slug)) {
    console.error('Choose one valid demo slug.')
    list()
    process.exitCode = 1
    return
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const branch = `run/${slug}-${timestamp.toLowerCase()}`
  const worktree = resolve('.worktrees', `${slug}-${timestamp.toLowerCase()}`)
  const result = run(`git worktree add -b ${branch} ${JSON.stringify(worktree)} demo/${slug}`)

  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exitCode = result.status ?? 1
    return
  }

  process.stdout.write(result.stdout)
  console.log('\nDemo worktree ready.')
  console.log(`Branch: ${branch}`)
  console.log(`Path: ${worktree}`)
  console.log(`Next: cd ${JSON.stringify(worktree)} && pnpm install && pnpm demo:doctor`)
}

async function doctor(): Promise<void> {
  const scenario = await readScenario()
  console.log(`Scenario: ${scenario.title}`)
  console.log(`Pattern: ${scenario.pattern}`)
  if (scenario.contract) console.log(`Contract: ${scenario.contract}`)

  let failures = 0
  for (const check of scenario.preflight) {
    console.log(`\n$ ${check.command}`)
    const result = run(check.command)
    const combined = `${result.stdout}${result.stderr}`
    process.stdout.write(combined)
    const exitMatches = result.status === check.expectedExit
    const outputMatches = check.outputIncludes ? combined.includes(check.outputIncludes) : true
    if (!exitMatches || !outputMatches) {
      failures += 1
      console.error(`Doctor mismatch: expected exit ${check.expectedExit}${check.outputIncludes ? ` and output containing ${check.outputIncludes}` : ''}`)
    }
  }

  if (failures > 0) {
    console.error(`\nDemo doctor failed: ${failures} mismatch(es)`)
    process.exitCode = 1
  } else {
    console.log('\nDemo doctor passed: seed state matches the scenario')
  }
}

const [command, argument] = process.argv.slice(2)

if (!command || command === 'list') list()
else if (command === 'start') start(argument)
else if (command === 'doctor') await doctor()
else {
  console.error(`Unknown demo command: ${command}`)
  list()
  process.exitCode = 1
}

