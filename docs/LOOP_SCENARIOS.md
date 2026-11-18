# Improvement projects

- RelayDesk is the application under test.
- Each project uses a fixed check, a bounded edit scope, and an explicit finish condition.
- Run experiments on a separate branch or worktree and keep evaluators fixed during repairs.

| Project | Check | Finish condition |
| --- | --- | --- |
| RAG retrieval | `pnpm rag:check` | Every expected approved article ranks first in all three retrievals, existing passes remain passing, and product tests pass. |
| Ticket search | `pnpm db:verify` and `pnpm perf:search` | Real PostgreSQL data, correct results, and k6 p95 below 300 ms. |
| API contract freshness | `pnpm eval:api-docs` | Valid OpenAPI, current generated types, and passing contract tests. |
| Grounded replies | `pnpm eval:ai-replies` | Frozen policy, citation, prompt, and required-action checks pass. Live semantic judgment requires configured model access. |
| Public help quality | `pnpm eval:help-center` | Answer coverage, source citations, crawlability, structured data, links, and page budgets pass. |
| Public site quality | `pnpm eval:site-quality` | Content checks and repeated Lighthouse budgets pass for the landing page, blog index, and a representative article. |

The [RAG project](RAG_LOOP.md) includes local setup, historical-state preparation, and a measurable repair task.
The [site checks](PERFORMANCE_CHECKS.md) explain the browser performance gates.
The [help-chat evaluation](HELP_CHAT_EVALUATION.md) explains the broader answer-quality checks.

The coding app owns investigation, edits, and repeated attempts.
Repository commands provide measurements and tests.
A higher aggregate score must not hide a regression in a previously passing case.
