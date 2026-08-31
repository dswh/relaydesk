import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const roots = ['src', 'docs', 'content', 'errors']
const patterns = [
  /sk-[A-Za-z0-9]{16,}/,
  /api[_-]?key\s*[:=]\s*["'][^"']+/i,
  /bearer\s+[A-Za-z0-9._-]{16,}/i,
]
const findings: string[] = []

async function visit(path: string): Promise<void> {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) {
      await visit(child)
      continue
    }
    const lines = (await readFile(child, 'utf8')).split('\n')
    lines.forEach((line, index) => {
      if (patterns.some((pattern) => pattern.test(line))) {
        findings.push(`${relative(root, child)}:${index + 1}`)
      }
    })
  }
}

for (const directory of roots) await visit(join(root, directory))

if (findings.length > 0) {
  console.error(`Secret scan failed: ${findings.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('Secret scan passed')
}

