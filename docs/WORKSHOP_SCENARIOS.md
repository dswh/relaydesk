# RelayDesk loop engineering runbook

RelayDesk is the product. The loops improve real product behavior and stop only when a fixed evaluator passes. A branch is workshop-ready only after its product capability and evaluator are healthy on `main`.

## Branch model

```text
main                                      healthy, deployable product
codex/scenario-<name>                     frozen credible starting state
codex/run-<name>-<date>                   disposable participant run
```

Use a fresh worktree for every live run. Never run a workshop loop on `main`, and never change the evaluator while the loop is active.

## Showcase readiness audit

Audited on 2 September 2026 from clean worktrees against every published `origin/codex/scenario-*` branch. A scenario is marked Ready only when its intended failure reproduces, the evaluator itself remains healthy, the healthy result is confirmed on `main`, and the branch contains a committed baseline.

| Demo | Frozen branch and commit | Verified scenario baseline | Verified healthy `main` target | Verdict |
| --- | --- | --- | --- | --- |
| PostgreSQL inbox page load | `codex/scenario-postgres-page-load` at `f9b253a` | k6 p95 625.59 ms, 0% HTTP failures, 100% checks, 100,007 PostgreSQL tickets. The original committed run recorded 783.15 ms. | k6 p95 22.13 ms, 0% failures, 100% checks. | Ready |
| Multi-page Lighthouse | `codex/scenario-lighthouse-quality` at `afd6714` | Performance 77 to 78, TBT 530 to 546 ms, accessibility 100, best practices 100, SEO 100, and 12 of 12 browser checks passing. | Six runs at 100 in all four categories, TBT 0, LCP 531 to 607 ms, and 12 of 12 browser checks passing. | Ready |
| API contract freshness | `codex/scenario-api-contract-freshness` at `998f7c7` | 4 of 5 contract tests pass. Strict AJV validation rejects undocumented `meta.source` and `meta.durationMs`; Redocly and type freshness still pass. | 5 of 5 contract tests, Redocly, and generated-type freshness pass. | Ready |
| Grounded AI reply quality | `codex/scenario-grounded-ai-reply-quality` at `d1c8bb4` | 0 of 5 cases pass because all five fail the frozen `prompt_integrity` gate. Other policy, citation, action, and helpfulness graders remain available. | 5 of 5 deterministic cases pass. The optional live judge requires `AI_GATEWAY_API_KEY`. | Ready, deterministic core |
| Help-center SEO and answer visibility | `codex/scenario-help-center-seo` at `715e752` | 4 of 5 answer cases, 8 of 9 crawl checks, help-directory SEO 66, performance 100, accessibility 100, best practices 100. | 5 of 5 answers, 9 of 9 crawl checks, and four Lighthouse runs at 100 in all categories with TBT 0. | Ready |

## Flagship loop catalog

| Loop | Product setup for the starting branch | Evaluator and industry tools | Fixed pass gate and stop condition | Bounded loop contract | Ideal visible output | Why it is worth showing | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PostgreSQL inbox page load and search | Seed Northstar Labs with at least 100,000 tickets. The scenario contains a credible query or index regression that makes `/inbox` and `/api/tickets` slow without changing returned data. | k6 for sustained HTTP load, PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for the query plan, `Server-Timing` for repository duration, and Vitest for result correctness. | k6 p95 below 300 ms, HTTP failure rate below 1%, checks above 99%, database source header present, at least 100,000 rows, search index used, targeted query execution below 100 ms, and unchanged result assertions. Stop when all gates pass twice consecutively. | Maximum 8 iterations or 45 minutes. One hypothesis and one measured change per iteration. Escalate if the database gate improves while the HTTP gate regresses. | A visibly immediate queue, a k6 summary changing from red to green, and an execution plan changing from a large scan to an indexed plan. | It connects a customer-visible delay to database evidence, concurrency, correctness, and an objective performance budget. The improvement is both felt and measured. | Ready. Verified p95 baseline: 625.59 ms. Original committed baseline: 783.15 ms. Healthy `main`: 22.13 ms. |
| Multi-page Lighthouse publishing quality | Use the real landing page, blog index, and eight server-rendered thousand-word field notes. The starting branch has a site-wide search-index warmup that ships article bodies to the browser and blocks the main thread across the publication. | Lighthouse CI with two runs across three representative pages, Chrome, Next.js production build, twelve Playwright content and crawl checks, BlogPosting schema, sitemap, and visual browser inspection. | Performance at least 0.95, accessibility 1.00, best practices 1.00, SEO 1.00, LCP below 2.5 s, CLS below 0.1, TBT below 200 ms, Speed Index below 3.0 s, all eight articles above 1,000 words, and all twelve browser checks passing. Stop when every run passes twice. | Maximum 10 iterations or 60 minutes. Preserve the visual design, article content, crawlable initial HTML, and search intent. Never change the budgets, remove posts, or hide meaningful content. | One shared client-boundary repair improves the landing page, directory, and every article. The six-run scorecard and the eight-page crawl suite turn green together. | It demonstrates system-level optimization across a real publishing surface. Performance, accessibility, SEO, structured data, content integrity, and internal links remain measurable. | Ready. Verified baseline: performance 77 to 78 and TBT 530 to 546 ms. Healthy `main`: six runs at 100 in all categories, TBT 0, and 12 of 12 checks passing. |
| API documentation contract freshness | The runtime returns real queue metadata that the frozen OpenAPI contract and generated TypeScript client do not yet describe. The reference at `/developers/api` is generated from that contract. | Redocly CLI, OpenAPI 3.1, openapi-typescript, AJV strict runtime validation, executable TypeScript examples, Vitest, and Playwright link checks. | Zero Redocly errors, generated types match byte for byte, zero undocumented response fields, all five contract tests pass, all examples compile, and public documentation links return below 400. Stop after two fully green runs. | Maximum 8 iterations or 60 minutes. Treat the API implementation and evaluator as read-only inputs. Escalate genuine contract ambiguity or a breaking change. | The contract, generated client, rendered reference, executable example, and live runtime all align in one verified pull request. | It shows autonomous maintenance across runtime code, schemas, generated types, examples, and prose with deterministic evidence. | Ready. Baseline: 4 of 5 tests, with two exact undocumented fields. Healthy `main`: 5 of 5 tests, valid OpenAPI, and current generated types. |
| Grounded AI reply quality | Freeze five synthetic support conversations, their approved sources, policy constraints, required actions, and the grounded-reply prompt. The scenario removes critical safety and citation instructions from the prompt. | Vercel AI SDK, AI Gateway, Promptfoo, deterministic prompt, policy, citation, and action graders, a pinned `anthropic/claude-sonnet-5` configuration, and a blinded LLM judge. | 100% prompt integrity and hard-policy compliance, citation precision at least 0.95, required-action recall at least 0.90, and live judge mean at least 4.5 out of 5 across three uncached runs. Stop only when every hard gate and repeated live judge pass. | Maximum 12 iterations or 120 minutes. The dataset, graders, thresholds, model IDs, and judge prompt are immutable. Escalate if improvements trade one customer segment against another. | Inbox drafts become specific and source-grounded while Promptfoo changes from red to green and the cited source cards remain visible beside the reply. | This is a defensible use of an LLM judge because subjective helpfulness sits behind deterministic policy, prompt, citation, and action gates. | Ready. Baseline: 0 of 5 cases because `prompt_integrity` fails. Healthy deterministic target: 5 of 5. Optional live judging requires `AI_GATEWAY_API_KEY`. |
| Help-center SEO and answer visibility | Use the real public help center, five server-rendered articles, structured data, sitemap, robots policy, `llms.txt`, and a frozen question corpus. The scenario blocks help crawlers and weakens a high-intent article. | Lighthouse CI, Chrome, Playwright, TechArticle schema checks, Promptfoo answer and citation graders, sitemap and `llms.txt` checks. | Zero broken links or crawl blocks, 100% canonical and structured-data validity, Lighthouse performance at least 0.90, accessibility at least 0.95, best practices and SEO at 1.00, and 100% pass rate across the five frozen answer cases. Stop after two green Lighthouse runs and three stable Promptfoo runs. | Maximum 10 iterations or 90 minutes. Change product content or implementation, never the question corpus, graders, or thresholds. Escalate when external ranking data is too sparse to support a claim. | The articles become crawlable, answerable, and citable, Promptfoo reaches 100%, and Lighthouse plus Playwright show the technical gates turning green. | It separates technical SEO, answer coverage, citations, structured data, and visible usefulness instead of claiming that one vanity score proves discovery. | Ready. Baseline: 4 of 5 answers, 8 of 9 crawl checks, and help-directory SEO 66. Healthy `main`: 5 of 5, 9 of 9, and Lighthouse 100 across four runs. |

## Codex Desktop instructor runbook

No terminal is required from the instructor. For each demonstration, open RelayDesk in Codex Desktop, ask Codex to create a new worktree from the specified frozen branch, then paste the corresponding prompt into Goal mode. Never run the loop directly on `main` or on the frozen scenario branch.

### PostgreSQL inbox page-load loop

**Starting branch:** `codex/scenario-postgres-page-load`

**Baseline to explain:** k6 p95 625.59 ms against a 300 ms limit, 0% HTTP failures, 100% correctness checks, and 100,007 PostgreSQL tickets. Healthy `main` reached 22.13 ms p95 in the same local environment.

**Goal-mode prompt:**

```text
Read docs/scenarios/postgres-page-load.md.

Set up the repository's PostgreSQL test environment and reproduce the frozen k6
baseline. Diagnose the customer-visible inbox and search latency using k6,
Server-Timing, and PostgreSQL execution plans. Make one measured change per
iteration while preserving response fields, search correctness, tenant scope,
and the 100,007-ticket dataset.

Do not edit the benchmark, thresholds, seed size, or correctness checks. Stop
only when database verification passes and the complete k6 gate passes twice
consecutively with p95 below 300 ms, HTTP failures below 1%, checks above 99%,
and PostgreSQL confirmed as the data source.

Finish with a before-and-after metric table, the relevant plan changes, and a
short explanation of why the improvement is real rather than a benchmark trick.
```

**Expected output:** a red-to-green k6 summary, p95 below 300 ms twice, zero correctness loss, PostgreSQL index evidence, and a visibly faster inbox. The healthy reference is approximately 22 ms p95, but the fixed pass gate is below 300 ms.

### Multi-page Lighthouse loop

**Starting branch:** `codex/scenario-lighthouse-quality`

**Baseline to explain:** landing page and blog score 78, the representative article scores 77 to 78, TBT is 530 to 546 ms, all other categories are 100, and 12 of 12 content and crawl checks already pass.

**Goal-mode prompt:**

```text
Read docs/scenarios/lighthouse-quality.md.

Evaluate the landing page, blog directory, and representative long-form article
using the existing Lighthouse and browser-quality gates. Diagnose the shared
performance regression and improve it through measured iterations. Preserve the
content, design, server-rendered articles, crawlability, and intended public
search capability.

Do not change the evaluator, lower budgets, remove articles, exclude pages, or
hide meaningful content. Stop only when all 12 browser checks and every
Lighthouse assertion pass in two consecutive six-run sessions.

Finish with a page-by-page before-and-after table and explain the shared change
that produced the improvement.
```

**Expected output:** performance at least 95 on every run, accessibility 100, best practices 100, SEO 100, TBT below 200 ms, and 12 of 12 browser checks. Healthy `main` currently produces six 100/100/100/100 reports with TBT 0.

### API documentation contract loop

**Starting branch:** `codex/scenario-api-contract-freshness`

**Baseline to explain:** Redocly and generated types pass, but strict runtime validation passes only 4 of 5 tests because `meta.source` and `meta.durationMs` are undocumented.

**Goal-mode prompt:**

```text
Read scenarios/api-contract-freshness/BASELINE.md.

Run the frozen API documentation evaluator and trace the mismatch across the
runtime payload, OpenAPI contract, generated TypeScript client, executable
example, and rendered developer reference. Reconcile those surfaces through
small measured iterations while preserving useful runtime metadata.

Do not relax additionalProperties, skip the failing response, delete useful
runtime fields, or edit the evaluator. Stop only after Redocly, generated-type
freshness, all 5 contract tests, examples, links, and the production build pass
twice consecutively.

Finish with the exact original mismatch and a list of every contract surface
that was brought back into alignment.
```

**Expected output:** 5 of 5 strict contract tests, zero Redocly errors, byte-current generated types, compiling examples, working public documentation links, and a concise list of the two newly documented fields.

### Grounded AI reply-quality loop

**Starting branch:** `codex/scenario-grounded-ai-reply-quality`

**Baseline to explain:** Promptfoo evaluates five fixed support conversations and all 5 fail `prompt_integrity`, producing a 0% pass rate. The healthy deterministic target is 5 of 5.

**Goal-mode prompt:**

```text
Read scenarios/grounded-ai-reply-quality/BASELINE.md.

Run the deterministic grounded-reply evaluator and diagnose the metric-level
failures across the prompt builder, approved evidence, citation extraction,
required actions, and visible reply contract. Make one bounded prompt or
generation change per iteration.

Do not edit the five cases, approved sources, graders, thresholds, model IDs, or
judge rubric. Do not replace generation with hard-coded case answers. Stop when
all 5 deterministic cases pass every hard gate twice consecutively. If
AI_GATEWAY_API_KEY is available, also run the uncached live generation and
blinded judge gate three times and require a mean of at least 4.5 out of 5.

Finish with a metric-by-metric before-and-after table, plus one example showing
how the repaired reply became safer and more grounded.
```

**Expected output:** deterministic Promptfoo results move from 0 of 5 to 5 of 5 while citation precision, action recall, policy, and helpfulness stay green. The optional credentialed extension adds three stable live-judge runs.

### Help-center SEO and answer-visibility loop

**Starting branch:** `codex/scenario-help-center-seo`

**Baseline to explain:** 4 of 5 answer cases, 8 of 9 crawl checks, and SEO 66 on `/help`. Performance, accessibility, and best practices remain 100, which isolates the discovery and content defects.

**Goal-mode prompt:**

```text
Read scenarios/help-center-seo/BASELINE.md.

Reproduce the frozen answer-quality, crawler, schema, link, and Lighthouse
failures. Diagnose the high-intent webhook answer and public crawler policy,
then improve the real article and technical discovery surfaces through bounded
iterations.

Do not edit the five questions, expected citations, graders, crawler checks, or
Lighthouse thresholds. Do not hard-code an answer for the failing question.
Stop only when all 5 answer cases pass across three stable runs, all 9 browser
checks pass, and both Lighthouse pages meet every configured assertion in two
consecutive sessions.

Finish with a before-and-after table for answer coverage, crawlability, and each
Lighthouse category, plus the corrected answer and citation.
```

**Expected output:** 5 of 5 answers, 9 of 9 browser checks, SEO 100 instead of 66, no broken links or crawl blocks, and Lighthouse performance, accessibility, and best practices remaining at 100.

## Strong use cases that are not ready yet

| Use case | Current asset | Why it is not yet a demo | Required readiness work |
| --- | --- | --- | --- |
| Linear roadmap execution loop | [RelayDesk: Durable Support Operations](https://linear.app/agentiwise/project/relaydesk-durable-support-operations-89f3f25a223b/overview), five phases and 16 dependency-linked issues from AGE-224 through AGE-239. | No repository-side locked acceptance pack, issue-aware evaluator, frozen starting branch, or measured failing baseline exists yet. No issue is labeled `loop-ready`. | Build the immutable AGE-224 vertical-slice evaluator, verify it fails on a credible product state, add the loop runner and CI contract, publish a frozen scenario branch, then promote only AGE-224 to `acceptance-locked` and `loop-ready`. |
| Customer-facing RAG answer-quality loop | A detailed design exists on the separate `codex/help-chat-rag-quality` workstream. | The customer help chat, PostgreSQL pgvector corpus, graders, measured baseline, and frozen scenario branch are not implemented. | Ship the healthy product capability first, freeze the dataset and graders, record retrieval plus answer-quality baselines, then create a credible regression branch. |

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
