import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../content/help-center.md', import.meta.url), 'utf8')
const required = [
  ['title metadata', /^title:\s*.+$/m],
  ['description metadata', /^description:\s*.+$/m],
  ['FAQ declaration', /^faq:\s*true$/m],
  ['review date', /^reviewed:\s*\d{4}-\d{2}-\d{2}$/m],
  ['frequently asked questions heading', /^## Frequently asked questions$/m],
] as const

const missing = required.filter(([, pattern]) => !pattern.test(page)).map(([label]) => label)

if (missing.length > 0) {
  console.error(`SEO audit failed. Missing: ${missing.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('SEO audit passed')
}

