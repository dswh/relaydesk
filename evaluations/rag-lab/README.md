# RAG evaluation tools

- Capture real help answers and traces, record human feedback, and evaluate proposed changes.
- Use [the retrieval project](../../docs/RAG_LOOP.md) for source-ranking checks and a repeatable starting problem.
- Investigation and repeated repairs belong to your coding app. These tools do not launch or supervise a coding agent.

## Configuration

Follow [the setup guide](../../docs/RAG_LOOP.md#setup) for PostgreSQL, OpenRouter, and LangSmith.
Use `.env.rag.example` as the local settings template.
Keep credentials in ignored `.env.local`.
Use the same embedding model for indexing and queries.

```sh
pnpm install --frozen-lockfile
docker compose -f compose.rag-evals.yaml up -d --wait
pnpm db:migrate
pnpm rag:preflight --remote
```

If the index is missing or stale, rebuild it and check readiness again.

```sh
pnpm knowledge:index
pnpm rag:preflight --remote
```

## Retrieval checks

```sh
pnpm rag:scenario --id follow-up-01
pnpm rag:check --product .worktrees/rag-follow-up-01
```

To use LangSmith as the source of questions, publish the six examples and pass the returned dataset name to the checker.

```sh
pnpm rag:langsmith:retrieval
pnpm rag:check --product .worktrees/rag-follow-up-01 --langsmith-dataset DATASET_NAME
```

For an expanded set, pass its file with `--dataset` to the publisher.
The dataset name changes with the questions. Use the same name for before and after.
Search scores are written to the local report, and traces are sent to LangSmith.

For the app preview, start Next.js with Webpack in the isolated copy.
Load the original checkout's local settings into the preview process.
Keep the settings file in the original checkout.

Scenario preparation creates an isolated historical product state without model calls.
Each check measures the selected product once and returns the queries, source ranks, and score.
It makes live embedding requests.
Use `--answers` only when answer samples are also needed.
Source-ranking success does not establish written-answer correctness.

## Human review

```sh
pnpm rag:capture --limit 15 --repeats 1
pnpm rag:review
```

Read each answer and the supplied evidence before recording Pass or Fail and a specific critique.
The review app is separate from the customer product.
Fixture captures can exercise the local workflow but cannot calibrate a live judge.

```sh
pnpm rag:langsmith:setup
pnpm rag:langsmith:enqueue
pnpm rag:feedback:sync
```

Cloud setup needs a complete capture of the current development dataset.
Use your own workspace key and project or agent address, not both.
Queue setup also needs the workspace or organization ID.

## Judge validation

Use representative real outputs with expert labels.
The starter tasks are development seeds, not sufficient evidence for a general judge.
Keep paraphrases in the same family when splitting calibration data.
Duplicate identical answers and fixture runs are excluded from calibration.

The configured policy requires at least 30 human Pass and 30 human Fail examples in each evaluation split.
It requires at least 90% failure detection and 90% correct acceptance.
These are project-specific thresholds.

```sh
pnpm rag:judge:validate
pnpm rag:judge:validate --finalize
```

Tune on the judge development split.
Use the reserved judge test once per judge version.
If it fails, prepare a new untouched test before another final estimate.
Never invent labels or relabel examples to obtain a pass.

## Answer-quality measurement

```sh
pnpm rag:measure
pnpm rag:experiment --name candidate
```

These are measurements, not repair runners.
The complete quality checker requires human labels and a validated judge.
An unscored semantic result cannot establish success.
Keep the dataset, corpus, models, rubric, and contract fixed for comparisons.

A higher total must not hide a critical regression or break an existing passing question.
A separate product acceptance set is required before release.

## Feedback for future repairs

Record approved implementation guidance in `feedback.md`.
Ask the coding agent to read it before the next attempt.
Saving a review label does not automatically change the repair instructions.
