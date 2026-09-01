# Scenario: RelayDesk multi-page publishing performance

## Product state

RelayDesk has a polished, server-rendered product page, a field-note directory, and eight long-form articles. A new site-wide public search warmup ships every article body to the browser and rebuilds its token index on the main thread during startup. The feature preserves the visible design and correct content, but it blocks interaction across every public page.

This is a realistic client-boundary regression. The workshop task is to keep the publishing system and its search intent while removing unnecessary browser work.

## Frozen evaluator

```bash
pnpm build
pnpm test:blog-quality
pnpm lighthouse
```

Playwright validates every article, internal link, crawler surface, and mobile layout. Lighthouse CI starts the production server and runs the landing page, blog directory, and a representative 1,108-word article twice each.

## Recorded baseline

| Surface | Performance | Accessibility | Best practices | SEO | LCP | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Landing page | 78 | 100 | 100 | 100 | 586 to 602 ms | 509 to 533 ms |
| Blog directory | 78 | 100 | 100 | 100 | 492 to 589 ms | 528 to 538 ms |
| Representative article | 78 | 100 | 100 | 100 | 488 to 586 ms | 527 to 536 ms |

Two consecutive six-run sessions reproduced the failure. The fixed gate requires performance at least 95, TBT below 200 ms, accessibility 100, best practices 100, SEO 100, LCP below 2.5 seconds, CLS below 0.1, and Speed Index below 3 seconds.

## Loop contract

- Maximum 10 iterations or 60 minutes.
- Preserve the product message, visual design, all eight articles, server-rendered initial content, and internal navigation.
- Form one performance hypothesis and make one bounded change per iteration.
- Do not edit `lighthouserc.cjs`, lower an assertion, exclude a page, remove an article, or hide meaningful content.
- Stop only after all twelve browser checks and every Lighthouse assertion pass in two consecutive six-run sessions.
- Escalate if an optimization changes the publication, weakens crawlability, or removes the intended search capability without replacing it responsibly.

## Reset

Create a new worktree from `codex/scenario-lighthouse-quality`. Do not repair or force-push this frozen branch during a workshop.
