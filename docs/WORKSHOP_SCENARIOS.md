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
| PostgreSQL inbox page load and search | Seed Northstar Labs with at least 100,000 tickets. The scenario contains a credible query or index regression that makes `/inbox` and `/api/tickets` slow without changing returned data. | k6 for sustained HTTP load, PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for the query plan, `Server-Timing` for repository duration, and Vitest for result correctness. | k6 p95 below 300 ms, HTTP failure rate below 1%, checks above 99%, database source header present, at least 100,000 rows, search index used, targeted query execution below 100 ms, and unchanged result assertions. Stop when all gates pass twice consecutively. | Maximum 8 iterations or 45 minutes. One hypothesis and one measured change per iteration. Escalate if the database gate improves while the HTTP gate regresses. | A visibly immediate queue, a k6 summary changing from red to green, and an execution plan changing from a large scan to an indexed plan. | It connects a customer-visible delay to database evidence, concurrency, correctness, and an objective performance budget. The improvement is both felt and measured. | Evaluator and product foundation implemented on `codex/measurable-loop-foundations`. Scenario branch follows after merge. |
| Landing page Lighthouse quality | Use the real RelayDesk public landing page. The starting branch has a believable performance or accessibility regression, such as oversized media, render-blocking code, layout movement, or an invalid semantic structure. | Lighthouse CI with three runs, Chrome, Next.js production build, and browser inspection. | Performance at least 0.95, accessibility 1.00, best practices at least 0.95, SEO 1.00, LCP below 2.5 s, CLS below 0.1, TBT below 200 ms, and Speed Index below 3.0 s. Stop when the median run passes every assertion twice. | Maximum 10 iterations or 45 minutes. Preserve the visual and product intent. Escalate if a score gain removes content, accessibility, or core interaction. | The same polished page loads faster, the four Lighthouse category scores turn green, and Core Web Vitals remain inside budget. | Everyone understands a slow website. Lighthouse creates a familiar, multi-dimensional scoreboard and prevents a fake win that sacrifices accessibility or SEO. | Evaluator and public page implemented on `codex/measurable-loop-foundations`. Scenario branch follows after merge. |
| API documentation contract freshness | Ship a real RelayDesk webhook or API field change while the reference, TypeScript example, and help article still describe the previous contract. | OpenAPI diff, generated client typecheck, executable documentation snippets, and a link checker. An LLM judge may score clarity only after deterministic gates pass. | Zero undocumented public fields, zero breaking changes without an approved version marker, 100% snippet compilation, 100% link success, and clarity at least 4.5 out of 5 on a frozen rubric. Stop after two fully green runs. | Maximum 8 iterations or 60 minutes. The API implementation and schema are read-only inputs. Escalate on a genuine contract ambiguity. | The API reference, executable example, and help article all update in one pull request, with contract checks proving alignment. | It shows autonomous maintenance across code and prose without relying on vague editorial judgment. | Planned. Requires the public webhook contract and documentation site. |
| Critical-path observability coverage | Implement ticket ingestion, retry, and reply paths with one deliberately untraced boundary in the scenario state. | OpenTelemetry SDK and Collector, Jaeger for trace inspection, structured-log contract tests, and a PII scanner. | 100% of frozen critical-path scenarios produce one connected trace, 100% contain required tenant, ticket, delivery, and outcome attributes, zero raw message bodies or email addresses appear in telemetry, and trace overhead stays below 5%. Stop after the full suite passes twice. | Maximum 8 iterations or 60 minutes. Instrument one boundary per iteration. Escalate if required correlation would expose customer content. | A previously blind webhook retry becomes one searchable trace from receipt through lease, delivery, and acknowledgement. | The output is operationally useful, visually compelling in a trace viewer, and protected by privacy and overhead budgets. | Planned. Requires webhook ingestion and the telemetry stack. |
| Production error to verified correction | Start from a sanitized captured error event tied to a reproducible attachment, import, or webhook payload. The branch reflects a credible historical product state, not a workshop-only failure flag. | Sentry for the event and stack, Playwright or contract tests for reproduction, Vitest for the nearest regression test, GitHub Actions for the final gate, and OpenTelemetry for correlated evidence. | Reproduction fails before the fix and passes after it, the regression test is green, related suites are green, the captured event fingerprint does not recur during a fixed replay, and no new high-severity event appears. Stop when the pull request is green and the replay gate passes. | Maximum 10 iterations or 90 minutes. Correct one fingerprint only. Escalate if the change needs a migration, customer communication, or destructive recovery. | A production symptom becomes a deterministic test, a narrow correction, a traceable pull request, and a cleared error replay. | It demonstrates a complete professional loop from external signal to verified engineering change, not just code generation. | Planned. Requires persistent mutations, error capture, and a replay harness. |
| Grounded AI reply quality | Freeze a versioned set of support conversations, approved sources, policy constraints, and expected actions. The scenario has a real prompt, retrieval, or policy regression. | Promptfoo for evaluation orchestration, deterministic policy and citation graders, a pinned model configuration, and a blinded LLM judge for helpfulness and completeness. | 100% hard-policy compliance, at least 0.95 citation precision, at least 0.90 required-action recall, no safety regression, and a mean judge score of at least 4.5 out of 5 across three repeated runs. Stop only when every hard gate and the repeated judge gate pass. | Maximum 12 iterations or 120 minutes. The dataset, rubric, model version, and judge prompt are immutable. Escalate if improvements trade one customer segment against another. | Suggested replies become more accurate and actionable while a scorecard proves citations and policies did not regress. | This is the strongest use of an LLM judge because subjective quality is isolated behind deterministic safety and grounding checks. | Planned. Requires the model gateway, retrieval layer, and evaluation package. |
| Help-center SEO and answer visibility | Publish a real public help center with structured articles and a frozen set of high-intent support questions. The scenario starts with technical crawl failures or weak answer coverage. | Lighthouse CI, Playwright crawl checks, schema validation, search-console exports when available, and Promptfoo with pinned search prompts for answer and citation coverage. | Zero critical crawl errors, 100% canonical and structured-data validity, accessibility at least 0.95, at least 0.90 answer coverage on the frozen question set, at least 0.90 citation correctness, and judge usefulness at least 4 out of 5. Stop after two green technical runs and three stable judge runs. | Maximum 10 iterations or 90 minutes. Change content or implementation, never the question set. Escalate when external ranking data is too sparse to support a claim. | A weak or missing article becomes crawlable, answerable, citable, and visibly useful in the public help center. | It avoids pretending that an SEO score equals business impact. Technical health, answer coverage, citations, and real search evidence are measured separately. | Planned. Requires the public help center and a stable content corpus. |

## Instructor commands for the ready loops

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
