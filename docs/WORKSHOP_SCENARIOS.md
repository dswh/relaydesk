# Workshop scenarios derived from RelayDesk

The loops are demonstrated on credible RelayDesk product states. A scenario branch may be created only after its underlying feature and verifier are healthy on `main`.

## Branch model

Each scenario uses three references:

```text
main                              healthy deployable product
codex/scenario-<name>             frozen starting state with a real product problem
codex/run-<name>-<timestamp>      disposable branch where a participant runs the loop
```

The scenario branch contains the complete product, the observable problem, baseline evidence, and a concise acceptance contract. It must not contain a script whose only purpose is to pretend that the product is broken.

## Planned scenarios

| Scenario | Product state | Primary sensor | Visible result | Best execution host |
| --- | --- | --- | --- | --- |
| Ticket-search performance | Customer and ticket search degrades as the dataset grows | Repeatable benchmark, query plan, browser timing | Queue search becomes visibly immediate and stays within budget | Codex or Claude Code in an isolated worktree |
| Documentation freshness | A webhook payload changes while the API reference and SDK example still show the old field | Contract test plus documentation example compilation | API, SDK, and help content align with the shipped behavior | Coding agent on a pull request, verified by GitHub Actions |
| Incremental migration | Legacy ticket status handling is replaced by a typed domain transition API | Migration inventory and full regression suite | One bounded slice moves per iteration without breaking the inbox | Scheduled coding-agent task in a persistent worktree |
| Logging coverage | Webhook retries cannot be correlated with their ticket and delivery lease | Trace coverage test and local telemetry viewer | A blind retry becomes one searchable end-to-end trace | Coding agent plus OpenTelemetry and error reporting |
| Production error to PR | A real attachment or import path fails for a specific payload shape | Captured error event and failing browser or contract reproduction | Incident becomes a regression test, correction, and green pull request | Error tracker, GitHub, and coding agent |
| Help-center search improvement | Search demand reveals an unanswered setup question | Search query evidence, content checks, and preview build | A weak article becomes a useful, publishable answer with valid metadata | Content and code agent in a pull request loop |
| AI answer evaluation | Suggested replies cite correct sources but violate one policy or miss a required action | Fixed scenario suite and explicit graders | Quality score improves without changing the rubric | Evaluation runner plus coding agent |
| Pull request watcher | A product pull request has a failed check or unresolved review request | GitHub status checks and review state | The loop observes, corrects, verifies, and stops when the PR is ready | Claude Code loop or a persistent Codex task |

## Scenario quality gate

A scenario is workshop-ready only when all of the following are true:

1. A non-technical observer can explain the customer or team impact.
2. The starting failure is reproducible at least three times.
3. The verifier measures product behavior rather than a hard-coded demonstration flag.
4. The loop has a bounded action, iteration limit, time limit, and escalation condition.
5. The final state is visible in the product, a trace, a test report, or a pull request.
6. The same scenario can be reset by creating a new branch or worktree.

No scenario branch should be created until its corresponding product capability exists on `main`.
