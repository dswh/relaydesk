# Multi-page Lighthouse showcase

## Product surface

The showcase covers a real public publishing system:

- RelayDesk landing page at `/`
- Field-note directory at `/blog`
- Eight server-rendered articles at `/blog/:slug`
- A representative 1,108-word article at `/blog/designing-a-support-operations-system`

Every article publishes a self-referencing canonical, BlogPosting structured data, a server-rendered body, a table of contents, related links, and a sitemap entry.

## Frozen evaluator

`pnpm eval:lighthouse-showcase` builds the production site, runs twelve Playwright content and crawl checks, then performs two Lighthouse runs on each representative page.

The Lighthouse gate requires:

- Performance at least 95
- Accessibility 100
- Best practices 100
- SEO 100
- LCP below 2,500 ms
- CLS below 0.1
- TBT below 200 ms
- Speed Index below 3,000 ms

The browser gate requires eight unique articles of at least 1,000 words, valid initial HTML, BlogPosting schema, canonicals, crawler exposure, sitemap and `llms.txt` entries, no broken internal links, and no mobile horizontal overflow.

## Healthy baseline

Recorded locally on 1 September 2026 using the production build:

| Page | Runs | Performance | Accessibility | Best practices | SEO | LCP range | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Landing page | 2 | 100 | 100 | 100 | 100 | 595 to 613 ms | 0 | 0 ms |
| Blog directory | 2 | 100 | 100 | 100 | 100 | 587 to 589 ms | 0 | 0 ms |
| Long-form article | 2 | 100 | 100 | 100 | 100 | 496 to 587 ms | 0 | 0 ms |

Playwright result: 12 of 12 checks passing.

## Frozen scenario baseline

The `codex/scenario-lighthouse-quality` branch contains a realistic client-boundary regression: a site-wide fuzzy-search warmup ships the article corpus to the browser and builds its complete suggestion index on the main thread.

Across two consecutive six-run sessions, every page scored 78 for performance and 100 for accessibility, best practices, and SEO. Total blocking time measured 509 to 538 ms against the fixed 200 ms maximum. The branch still passes all twelve content, crawl, link, structured-data, and mobile checks.

## Workshop loop contract

- Start from `codex/scenario-lighthouse-quality` in a fresh worktree.
- Maximum 10 iterations or 60 minutes.
- Diagnose one audit family and make one bounded change per iteration.
- Preserve the product message, all eight articles, initial server-rendered content, accessibility, and internal navigation.
- Never edit `lighthouserc.cjs`, lower a threshold, exclude a page, or weaken the browser checks.
- Stop only when the full evaluator passes twice consecutively.
