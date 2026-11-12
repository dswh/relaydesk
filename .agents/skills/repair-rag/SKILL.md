---
name: repair-rag
description: Repair one measured RelayDesk RAG failure in an isolated loop candidate. Use the supplied failure trace and reference behavior to improve the shared pipeline.
---

Use the selected trace to identify the first incorrect stage.

State one hypothesis before changing code.
Make the smallest shared correction that addresses the cause.

The approved public corpus defines product facts.
For example, webhook retry documentation supports idempotent processing and delivery identifiers. It does not authorize promises about billing credits.
If the necessary knowledge is missing, report a content gap for human review.

Allowed product files:

- `src/lib/ai/help-chat.ts`
- `src/lib/help-chat-config.ts`
- `src/lib/knowledge-repository.ts`
- New focused tests under `tests/rag-repairs/`

Keep approved-public source filtering, safe refusal behavior, and useful answers to supported parts of mixed questions.
Follow the existing implementation patterns in the candidate repository.
In particular, preserve the approved-source filter in retrieveHelpKnowledge() and derive citation URLs from retrieved source metadata.
Use the existing prompt builder as the grounding pattern.
Separate the supported part of a mixed request from any claim the evidence cannot verify.

The harness owns the dataset, evaluator, rubric, models, dependency files, source content, budgets, and acceptance rules.
Do not change them.
Do not branch on case IDs, memorize questions, disable checks, or replace generation with benchmark answers.

Run the relevant product tests available in the candidate.
The trusted harness runs the frozen quality evaluation after you finish.

Use this response template:

- Hypothesis: the incorrect stage and expected effect.
- Change: the shared correction and changed files.
- Tests: exact commands and results.
- Uncertainty: missing evidence or remaining risks.
Leave the change uncommitted for the harness to inspect.
Do not publish, deploy, merge, message others, or launch another improvement loop.
