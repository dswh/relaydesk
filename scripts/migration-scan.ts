import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const sourceRoot = join(root, 'src')
const violations: string[] = []

async function visit(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await visit(path)
      continue
    }
    if (!entry.name.endsWith('.ts') || entry.name === 'legacy-logger.ts') continue

    const lines = (await readFile(path, 'utf8')).split('\n')
    lines.forEach((line, index) => {
      if (line.includes('legacyLog') || line.includes('legacy-logger')) {
        violations.push(`${relative(root, path)}:${index + 1}: ${line.trim()}`)
      }
    })
  }
}

await visit(sourceRoot)

if (violations.length > 0) {
  console.error(`Migration scan found ${violations.length} violation(s):`)
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exitCode = 1
} else {
  console.log('Migration scan passed: 0 legacy logging violations')
}

