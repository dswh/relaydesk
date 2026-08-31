# RelayDesk loop engineering runbook

RelayDesk is the product. The loops improve real product behavior and stop only when a fixed evaluator passes. A branch is workshop-ready only after its product capability and evaluator are healthy on `main`.

## Branch model

```text
main                                      healthy, deployable product
codex/scenario-<name>                     frozen credible starting state
codex/run-<name>-<date>                   disposable participant run
```

Use a fresh worktree for every live run. Never run a workshop loop on `main`, and never change the evaluator while the loop is active.

## Flagship loop catalog

| Loop | Product setup for the starting branch | Evaluator and industry tools | Fixed pass gate and stop condition | Bounded loop contract | Ideal visible output | Why it is worth showing | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PostgreSQL inbox page load and search | Seed Northstar Labs with at least 100,000 tickets. The scenario contains a credible query or index regression that makes `/inbox` and `/api/tickets` slow without changing returned data. | k6 for sustained HTTP load, PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for the query plan, `Server-Timing` for repository duration, and Vitest for result correctness. | k6 p95 below 300 ms, HTTP failure rate below 1%, checks above 99%, database source header present, at least 100,000 rows, search index used, targeted query execution below 100 ms, and unchanged result assertions. Stop when all gates pass twice consecutively. | Maximum 8 iterations or 45 minutes. One hypothesis and one measured change per iteration. Escalate if the database gate improves while the HTTP gate regresses. | A visibly immediate queue, a k6 summary changing from red to green, and an execution plan changing from a large scan to an indexed plan. | It connects a customer-visible delay to database evidence, concurrency, correctness, and an objective performance budget. The improvement is both felt and measured. | Ready on `codex/scenario-postgres-page-load`. Recorded p95 baseline: 783.15 ms. Healthy `main` p95: 31.53 ms. |
| Landing page Lighthouse quality | Use the real RelayDesk public landing page. The starting branch has a believable performance or accessibility regression, such as oversized media, render-blocking code, layout movement, or an invalid semantic structure. | Lighthouse CI with three runs, Chrome, Next.js production build, and browser inspection. | Performance at least 0.95, accessibility 1.00, best practices 1.00, SEO 1.00, LCP below 2.5 s, CLS below 0.1, TBT below 200 ms, and Speed Index below 3.0 s. Stop when every run passes every assertion twice. | Maximum 10 iterations or 45 minutes. Preserve the visual and product intent. Escalate if a score gain removes content, accessibility, or core interaction. | The same polished page loads faster, the four Lighthouse category scores turn green, and Core Web Vitals remain inside budget. | Everyone understands a slow website. Lighthouse creates a familiar, multi-dimensional scoreboard and prevents a fake win that sacrifices accessibility or SEO. | Ready on `codex/scenario-lighthouse-quality`. Recorded baseline: 100 performance, 95 accessibility, 96 best practices, 92 SEO. Healthy `main`: 100 in all four categories. |
| API documentation contract freshness | The runtime returns real queue metadata that the frozen OpenAPI contract and generated TypeScript client do not yet describe. The reference at `/developers/api` is generated from that contract. | Redocly CLI, OpenAPI 3.1, openapi-typescript, AJV strict runtime validation, executable TypeScript examples, Vitest, and Playwright link checks. | Zero Redocly errors, generated types match byte for byte, zero undocumented response fields, all five contract tests pass, all examples compile, and public documentation links return below 400. Stop after two fully green runs. | Maximum 8 iterations or 60 minutes. Treat the API implementation and evaluator as read-only inputs. Escalate genuine contract ambiguity or a breaking change. | The contract, generated client, rendered reference, executable example, and live runtime all align in one verified pull request. | It shows autonomous maintenance across runtime code, schemas, generated types, examples, and prose with deterministic evidence. | Ready on `codex/scenario-api-contract-freshness`. Healthy `main`: valid OpenAPI, current generated types, and 5 of 5 contract tests passing. |
| Grounded AI reply quality | Freeze five synthetic support conversations, their approved sources, policy constraints, required actions, and the grounded-reply prompt. The scenario removes critical safety and citation instructions from the prompt. | Vercel AI SDK, AI Gateway, Promptfoo, deterministic prompt, policy, citation, and action graders, a pinned `anthropic/claude-sonnet-5` configuration, and a blinded LLM judge. | 100% prompt integrity and hard-policy compliance, citation precision at least 0.95, required-action recall at least 0.90, and live judge mean at least 4.5 out of 5 across three uncached runs. Stop only when every hard gate and repeated live judge pass. | Maximum 12 iterations or 120 minutes. The dataset, graders, thresholds, model IDs, and judge prompt are immutable. Escalate if improvements trade one customer segment against another. | Inbox drafts become specific and source-grounded while Promptfoo changes from red to green and the cited source cards remain visible beside the reply. | This is a defensible use of an LLM judge because subjective helpfulness sits behind deterministic policy, prompt, citation, and action gates. | Ready on `codex/scenario-grounded-ai-reply-quality`. Healthy fixture gate: 5 of 5 cases passing. Live generation and judging require `AI_GATEWAY_API_KEY`. |
| Help-center SEO and answer visibility | Use the real public help center, five server-rendered articles, structured data, sitemap, robots policy, `llms.txt`, and a frozen question corpus. The scenario blocks help crawlers and weakens a high-intent article. | Lighthouse CI, Chrome, Playwright, TechArticle schema checks, Promptfoo answer and citation graders, sitemap and `llms.txt` checks. | Zero broken links or crawl blocks, 100% canonical and structured-data validity, Lighthouse performance at least 0.90, accessibility at least 0.95, best practices and SEO at 1.00, and 100% pass rate across the five frozen answer cases. Stop after two green Lighthouse runs and three stable Promptfoo runs. | Maximum 10 iterations or 90 minutes. Change product content or implementation, never the question corpus, graders, or thresholds. Escalate when external ranking data is too sparse to support a claim. | The articles become crawlable, answerable, and citable, Promptfoo reaches 100%, and Lighthouse plus Playwright show the technical gates turning green. | It separates technical SEO, answer coverage, citations, structured data, and visible usefulness instead of claiming that one vanity score proves discovery. | Ready on `codex/scenario-help-center-seo`. Healthy `main`: 5 of 5 answer cases, 9 of 9 crawl tests, and two Lighthouse runs passing. |

## Instructor commands for the ready loops

### Create a clean participant worktree

```bash
git fetch origin
git worktree add .worktrees/postgres-loop \
  -b codex/run-postgres-$(date +%Y%m%d) \
  origin/codex/scenario-postgres-page-load
```

Replace the scenario name, run name, and worktree folder with the loop selected below. Each participant works on a disposable run branch while the scenario remains frozen and easy to reset.

### PostgreSQL performance loop

```bash
cp .env.example .env.local
pnpm db:setup
pnpm db:verify
pnpm dev
pnpm perf:search
```

Run `pnpm perf:search` in a second terminal after the app is ready. The k6 check fails if the app silently falls back to the small in-memory dataset.

### Lighthouse loop

```bash
pnpm build
pnpm lighthouse
```

Lighthouse CI starts the production server, runs the landing page three times, saves local reports in `.lighthouseci`, and exits non-zero when any fixed budget fails.

### API documentation freshness loop

```bash
git worktree add .worktrees/api-docs-loop \
  -b codex/run-api-docs-$(date +%Y%m%d) \
  origin/codex/scenario-api-contract-freshness
cd .worktrees/api-docs-loop
pnpm install
pnpm eval:api-docs
```

The frozen evaluator lints the OpenAPI contract, compares generated types, validates real route responses strictly, compiles the TypeScript example, and checks the rendered operation catalog.

### Grounded AI reply quality loop

```bash
git worktree add .worktrees/ai-reply-loop \
  -b codex/run-ai-reply-$(date +%Y%m%d) \
  origin/codex/scenario-grounded-ai-reply-quality
cd .worktrees/ai-reply-loop
pnpm install
pnpm eval:ai-replies
pnpm eval:ai-replies:live
```

The deterministic gate runs without credentials. Add `AI_GATEWAY_API_KEY` to `.env.local` before the live command. Run the live command three times without cache before declaring the loop complete.

### Help-center SEO and answer-visibility loop

```bash
git worktree add .worktrees/help-center-loop \
  -b codex/run-help-center-$(date +%Y%m%d) \
  origin/codex/scenario-help-center-seo
cd .worktrees/help-center-loop
pnpm install
pnpm eval:help-center
```

The evaluator runs the frozen Promptfoo question corpus, a production build, nine Playwright crawl and schema checks, and two Lighthouse passes on the help directory and webhook article.

## Rules for LLM-as-judge evaluators

1. Pin the evaluated dataset, rubric, judge prompt, model family, and model settings before the loop starts.
2. Put policy, security, citation, schema, and correctness checks in deterministic graders.
3. Use an LLM judge only for qualities that need judgment, such as clarity, completeness, or usefulness.
4. Blind the judge to iteration labels and previous scores.
5. Require repeated runs and report the score distribution, not only the best score.
6. Never let the loop edit its judge, acceptance threshold, or test cases.

## Items intentionally removed from the showcase

| Removed item | Reason |
| --- | --- |
| Pull-request watcher | It is a way to host or continue a loop, not a product improvement use case. GitHub Actions and a coding agent still support several loops above. |
| Incremental migration | It is professionally useful, but too generic for the flagship showcase unless RelayDesk first acquires a specific migration with a measurable customer outcome. |
| Open-ended architecture satisfaction | A subjective architecture score can move without proving product value. Concrete architecture constraints belong inside the relevant loop gates. |
| Standalone test repair | It is a useful five-minute introduction to loop mechanics, but it is too small and too familiar to create the flagship effect. Regression tests remain sensors inside stronger loops. |
| Critical-path observability coverage | It requires a complete ingestion and telemetry environment, and its outcome is more operator-focused than this showcase needs. |
| Production error to verified correction | A credible demonstration requires live error-tracker state, replay infrastructure, and incident context that RelayDesk does not yet have. |

## Scenario quality gate

A scenario branch may be published only when all of these are true:

1. A non-technical observer can explain the customer or operator impact.
2. The starting failure reproduces at least three times.
3. The baseline report is committed or attached to the branch documentation.
4. The evaluator measures real behavior and cannot pass through a workshop-only flag.
5. The loop has an iteration limit, time limit, escalation condition, and rollback path.
6. Correctness, security, accessibility, or privacy guardrails prevent a narrow metric hack.
7. The final state is visible in the product and in a machine-readable report.
8. A new worktree can reset the scenario without destructive cleanup.
