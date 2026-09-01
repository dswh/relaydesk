# RelayDesk help-chat loop prompt

Copy this prompt into the coding agent from a fresh participant worktree created from `codex/scenario-help-chat-rag-quality`.

```text
Improve the RelayDesk customer help chat until the frozen evaluation gate passes.

Work only in this participant branch. Treat evaluations/help-chat/dataset.yaml,
the expected sources and answers, assertions, judge rubric, judge model, thresholds,
and browser tests as read-only.

For each iteration:
1. Run the smallest relevant evaluator, then inspect the actual output and failed gates.
2. Group failures into retrieval, generation, citation, refusal, context, or stability.
3. Select the largest shared root cause and record one hypothesis in LOOP_STATE.md.
4. Make one shared prompt, retrieval, or configuration change. Do not add rules for a
   specific evaluation question.
5. Rerun the affected cases, then the full deterministic suite.
6. Record score changes, regressions, latency, tokens, and the next decision.

Useful commands:
- pnpm eval:help-chat:deterministic
- pnpm eval:help-chat:deterministic -- --case=HC-012
- pnpm eval:help-chat:promptfoo
- pnpm eval:help-chat:live
- pnpm eval:help-chat:report
- pnpm build && pnpm test:help-chat-browser

Do not weaken a gate, edit the dataset or judge, delete a case, change a threshold,
or edit help-center facts only to satisfy the evaluator. Stop when the complete gate
passes twice, after 10 iterations, after 90 minutes, when the workshop spend limit is
reached, or when a documented escalation condition occurs. Require human review before
merging.
```
