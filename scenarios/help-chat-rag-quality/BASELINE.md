# Help-chat RAG quality frozen baseline

Branch: `codex/scenario-help-chat-rag-quality`

Healthy parent: `codex/help-chat-rag-quality` at `d8aabdd`

Recorded: 2026-09-02 in the local workshop environment with deterministic embeddings, generation fixture, and judge proxy.

## Product state

The page, pgvector index, shared retrieval path, streaming API, evaluator, reports, and browser tests are all real. This branch freezes a credible first configuration:

- vector-only retrieval with `topK = 2`
- no minimum evidence threshold
- no follow-up context in the retrieval query
- no citation requirement
- no ambiguity or prompt-injection handling
- a short helpful-assistant prompt without the evidence, refusal, or citation contract

No question-specific failure logic is present. The same configuration affects browser requests and evaluation cases.

## Reproduced baseline

`pnpm eval:help-chat:deterministic` was run three times. All three runs produced the same scores and failure clusters, and correctly exited non-zero.

| Metric | Run 1 | Run 2 | Run 3 | Gate |
| --- | ---: | ---: | ---: | ---: |
| Source recall@5 | 1.000 | 1.000 | 1.000 | at least 0.930 |
| MRR | 1.000 | 1.000 | 1.000 | at least 0.850 |
| No-source accuracy | 0.000 | 0.000 | 0.000 | 1.000 |
| Deterministic pass rate | 0.000 | 0.000 | 0.000 | 1.000 |
| Judge correctness | 4.200 | 4.200 | 4.200 | at least 4.500 |
| Judge groundedness | 1.000 | 1.000 | 1.000 | at least 4.700 |
| Judge completeness | 3.933 | 3.933 | 3.933 | at least 4.300 |
| Judge relevance | 4.200 | 4.200 | 4.200 | at least 4.500 |
| Judge clarity | 5.000 | 5.000 | 5.000 | at least 4.300 |
| Judge max standard deviation | 0.000 | 0.000 | 0.000 | at most 0.500 |

Failure pattern:

- All answered cases fail expected-source cards, paragraph citations, and prompt integrity.
- HC-011 through HC-014 also fail outcome and required-fact checks because the configuration answers ambiguous, missing-knowledge, out-of-domain, and prompt-injection requests.
- Retrieval metrics remain green. This is intentional evidence that the first repair belongs in the response policy and evidence threshold, not in the vector index.

## Start a participant run

```bash
git worktree add .worktrees/help-chat-loop \
  -b codex/run-help-chat-$(date +%Y%m%d) \
  codex/scenario-help-chat-rag-quality
cd .worktrees/help-chat-loop
pnpm install
cp .env.example .env.local
pnpm demo:help-chat:setup
pnpm eval:help-chat:deterministic
pnpm dev
```

Open `/help/ask`, then copy `evaluations/help-chat/LOOP_PROMPT.md` into the coding agent. The failing command is the expected starting point.

Each run writes `evaluation-results.csv` and `score-summary.csv` under `evaluations/help-chat/runs/<run-id>/`. Import them into one Google Sheet as the `Cases` and `Scorecard` tabs.

## Reset and rollback

Delete the disposable participant worktree and create a new one from this frozen branch. Do not reset or modify the scenario branch during a workshop. The PostgreSQL indexer is idempotent, so no manual data cleanup is required.
