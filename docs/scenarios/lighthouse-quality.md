# Scenario: RelayDesk landing page quality

## Product state

RelayDesk has a polished, server-rendered public product page, but the first design pass missed several production details. Small editorial text does not meet WCAG contrast, the robots file uses an invalid relative sitemap URL, and the site has no icon, which creates a console-level 404.

The page remains visually complete and fast. The scenario is a credible pre-launch quality pass, not a deliberately slow page or a hard-coded Lighthouse failure.

## Frozen evaluator

```bash
pnpm build
pnpm lighthouse
```

Lighthouse CI starts the production server and runs the page three times.

## Recorded baseline

| Metric | Baseline | Required |
| --- | ---: | ---: |
| Performance | 100 | At least 95 |
| Accessibility | 95 | 100 |
| Best practices | 96 | 100 |
| SEO | 92 | 100 |
| LCP | About 606 ms | Below 2,500 ms |
| CLS | 0 | Below 0.1 |
| TBT | 0 ms | Below 200 ms |

## Loop contract

- Maximum 10 iterations or 45 minutes.
- Preserve the product message, page sections, primary actions, and distinctive relay visualization.
- Change one diagnosed audit family per iteration.
- Do not edit `lighthouserc.cjs`, lower an assertion, hide meaningful content, or remove keyboard access.
- Stop only after every assertion passes in two consecutive three-run sessions.
- Escalate if a score improvement changes the product message or damages visual hierarchy.

## Reset

Create a new worktree from `codex/scenario-lighthouse-quality`. Do not repair or force-push this frozen branch during a workshop.
