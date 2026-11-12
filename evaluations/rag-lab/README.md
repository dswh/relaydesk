# RelayDesk RAG improvement loop

Open the complete hands-on guide at http://127.0.0.1:4180/workshop after starting `pnpm rag:review`.

The implementation lives on `codex/rag-langsmith-evals` in the dedicated `relaydesk-rag-evals` worktree.
It uses synthetic support questions and approved public knowledge.

## Desired state

Every question passes all three repetitions.
A repetition must pass every exact check and the validated semantic judge.

The total score is `100 * passing questions / total questions`.
An unscored question prevents a total and cannot establish success.

A candidate must repair its selected failure.
It must preserve every passing question, avoid new exact-check failures, and avoid more failed repetitions in another question.
A higher total cannot hide a critical regression.

## Local preparation

Run commands from this worktree.
Keep secrets only in the ignored `.env.local` file.

```sh
pnpm install --frozen-lockfile
docker compose -f compose.rag-evals.yaml up -d --wait
pnpm db:migrate
pnpm knowledge:index
pnpm rag:preflight
pnpm rag:review
```

The dedicated database listens on `127.0.0.1:5440`.
The review tool listens on `127.0.0.1:4180`.
The product's help UI stays separate from the review tool.

The prepared LangSmith agent is `relaydesk-rag-workshop` in the Personal organization, US region.
Use a workspace-scoped service key for tracing, datasets, feedback, and experiments.
A tracing-only key cannot perform the complete workflow.

Configure these environment variables before live capture:

```dotenv
AI_GATEWAY_API_KEY=
RELAYDESK_HELP_GENERATION_MODEL=
RELAYDESK_HELP_JUDGE_MODEL=
RELAYDESK_HELP_EMBEDDING_MODE=gateway
RELAYDESK_HELP_EMBEDDING_MODEL=openai/text-embedding-3-small
LANGSMITH_API_KEY=
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_AGENT_ID=relaydesk-rag-workshop
LANGSMITH_AGENT_ENVIRONMENT=local
```

Select generation and judge IDs from the current provider catalog.
Reindex after switching from fixture embeddings to gateway embeddings.
Use the same embedding model for indexing and queries.
Leave `LANGSMITH_PROJECT` empty when using agent addressing.
The organization ID in a browser URL is different from the optional workspace ID.

Restart the watcher after changing credentials or environment configuration.
Set a provider-side spend limit before unattended use.
The harness enforces candidate and time bounds. It does not enforce a monetary cap.

## Human review and judge preparation

```sh
pnpm rag:capture --limit 15 --repeats 2
pnpm rag:langsmith:setup
pnpm rag:langsmith:enqueue
pnpm rag:review
```

Start with open-ended expert review of 20 to 50 real outputs.
Record Pass or Fail and a specific critique.
Group recurring failures and refine the rubric before freezing it.

The 15 starter tasks are development seeds.
They are too small to validate a general semantic judge.
Expand representative calibration coverage before relying on automated acceptance.

`vars.caseFamily` keeps paraphrases in one family.
The deterministic family split separates few-shot, development, and held-out judge examples.
Duplicate identical answers and fixture runs are excluded from calibration.
Use `--limit 50 --offset 0`, then offset 50 and onward, for a larger calibration corpus.
The default active file is `evaluations/rag-lab/questions.yaml`.
It starts with 15 seed tasks. The existing product regression dataset stays frozen.
Use `RELAYDESK_RAG_DATASET_FILE` to select a different versioned YAML file.
Use a separate active repair dataset of at most 50 questions.

The workshop policy requires at least 30 human Pass and 30 human Fail examples per evaluation split.
Both verdicts must appear in the few-shot examples.
The judge must reach at least 90% failure detection and 90% correct acceptance.
Reports also show confidence intervals.
These thresholds are workshop policy, not universal requirements from Hamel.

```sh
pnpm rag:judge:validate
pnpm rag:judge:validate --finalize
```

Tune on the judge development split.
Use the held-out judge test once per judge version.
If it fails, report the failure and prepare a new untouched test before another final estimate.
Do not fabricate expert labels or relabel examples to make a judge pass.

## One complete iteration

```sh
pnpm rag:contract
pnpm rag:measure
pnpm rag:loop:status
pnpm rag:loop --force
```

The trusted checker freezes the dataset, source/index hash, grader, models, and contract.
The controller selects one scored failure, with critical failures first.
Codex receives the selected evidence, reviewed feedback, and repair skill.
It edits a fresh candidate worktree.
The checker validates scope, product tests, repeated answers, and the regression rule.

One active run tries at most five candidates or runs for 30 minutes.
An improved candidate waits for engineer review.
Rejected candidates never replace the working baseline.
Reports remain under the ignored `evaluations/rag-lab/data/loops/` directory.

Inspect the diff, scorecards, decision, and actor summary before choosing one command:

```sh
pnpm rag:loop:accept
# Or reject it:
pnpm rag:loop:reject
```

Acceptance copies the exact measured patch into this local feature worktree.
It does not merge, publish, or deploy.
A separate sealed product acceptance set is required before release.
The repair set and judge-calibration sets do not replace it.

## Keep watching

```sh
pnpm rag:loop --watch
```

The watcher detects new questions and source changes.
For the live exercise, append `new-question.example.yaml` to `questions.yaml` once.
The extra task asks whether slow webhook processing should delay acknowledgement.
Its reference behavior comes from the approved webhook article.
Use a unique case ID for every later question.
A process lock prevents overlapping runs.
One pending review blocks a new candidate.

After success, it waits and rechecks every 30 minutes by default.
Set `RAG_RECHECK_MINUTES` to change that interval.
A new question set creates a new epoch and a fresh baseline.
A regression selects the next bounded repair.
Configuration problems and bounded stops wait for human steering.
Use `--force` to deliberately retry after inspecting the reason.

If you need to stop, use Ctrl+C in the terminal running the watcher.
Do not run concurrent controller commands during an active repair.

## Smoke checks before model access

```sh
pnpm rag:capture --fixture --local
pnpm rag:loop --fixture --force
pnpm verify
```

These checks exercise the real database, retrieval path, trace capture, UI data, and scoring rules.
They do not prove answer quality or calibrate a semantic judge.
The fixture loop never starts the repair agent and never declares the quality goal reached.

## Source sequence

The hands-on guide adapts Kyle Mistele's API migration example into RAG quality.

1. Sensor, 9:33.
2. Regression protection, 10:37.
3. Controller, 11:08.
4. Actuator, 12:31.
5. Workflow execution, 13:20.
6. Human feedback, 14:06.
7. Flow control, 15:10.

The source checks for one open labeled PR.
This local workshop uses one pending candidate and an exclusive controller lock.

Sources:

- https://www.youtube.com/watch?v=xIt_mTQp6mY
- https://hamel.dev/blog/posts/evals/
- https://hamel.dev/blog/posts/llm-judge/
- https://hamel.dev/blog/posts/evals-faq/should-i-build-a-custom-annotation-tool-or-use-something-off-the-shelf.html
- https://docs.langchain.com/langsmith/evaluate-llm-application
