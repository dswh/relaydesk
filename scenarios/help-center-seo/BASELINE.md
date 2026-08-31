# Help-center SEO and answer visibility baseline

## Workshop starting state

The public help center renders, but two production regressions reduce discovery and answer quality. `robots.txt` blocks `/help` for both general and AI search crawlers, and the webhook article has been replaced with vague troubleshooting copy that no longer answers a high-intent customer question.

## Reproduce answer quality

```bash
pnpm eval:help-answers
```

The command was run three times after the scenario build. Every run produced the same result:

- Frozen questions evaluated: 5
- Passing questions: 4
- Failing questions: 1
- Failing case: duplicate webhook deliveries
- Measured regression: wrong citation retrieval and missing delivery identifier, idempotency, success-response, and retry concepts

## Reproduce crawler visibility

```bash
pnpm build
pnpm test:help-crawl
```

The browser suite was run three times against the production build. Every run produced the same result:

- Browser checks: 9
- Passing checks: 8
- Failing check: `exposes every public article to search and answer crawlers`
- Exact cause: `robots.txt` contains `Disallow: /help`

## Loop contract

1. Run both evaluators and record the question-level and browser-level failures.
2. Inspect public article content, retrieval behavior, metadata, schema, sitemap, `llms.txt`, and crawler policy.
3. Make one bounded content, retrieval, or technical SEO change.
4. Run the same five questions and nine browser checks again.
5. Run `pnpm lighthouse:help` only after the answer and crawl gates pass.
6. Stop when all 5 answer cases and all 9 browser checks pass, and Lighthouse meets the configured thresholds on both target pages.

Do not remove the webhook question, lower answer-coverage thresholds, or special-case its expected answer in the evaluator. The public article must become sufficiently complete for the real retrieval and answer path to succeed.

## Healthy target

On `main`, both target pages scored 100 for performance, accessibility, best practices, and SEO across two Lighthouse runs each. LCP was approximately 0.55 seconds and CLS was 0.

## Why this is a strong loop

The loop combines a user-facing content defect with a technical discovery defect, yet both are objectively measurable. The audience sees the agent move from a failing search question and blocked crawler policy to a complete, cited answer, crawlable pages, valid structured data, and repeatable Lighthouse scores.
