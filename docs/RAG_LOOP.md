# RAG retrieval improvement

- Investigate support follow-ups that lose their earlier topic during search.
- Use a coding agent to make small changes and run the same retrieval checks after each change.
- The score measures source ranking. Written answer quality remains a separate review.

## Setup

Use Node.js 22 or newer, pnpm 10.10.0, Git, and Docker with Compose.
Open this project in your coding app.
No second coding CLI is required.

```sh
pnpm install --frozen-lockfile
cp .env.rag.example .env.local
```

Copy the example only in a fresh checkout.
Keep an existing `.env.local` and its spending ledger.

Fill in your own OpenRouter and LangSmith keys privately.
Create the `relaydesk-rag` tracing project in your LangSmith workspace.
Set its API endpoint for your region.
Use `LANGSMITH_WORKSPACE_ID` if your account requires it.
Leave `LANGSMITH_AGENT_ID` empty when using project addressing.

Set `RELAYDESK_MODEL_BUDGET_FILE` to an absolute path in this checkout, ending in `evaluations/rag-lab/data/model-budget.json`.
For example, a checkout at `/home/engineer/relaydesk` uses `/home/engineer/relaydesk/evaluations/rag-lab/data/model-budget.json`.
Keep that same ledger for all measurements.
Leave `RELAYDESK_HELP_INCLUDE_CONTEXT` unset so the code controls conversation handling.

Start Docker, then run:

```sh
docker compose -f compose.rag-evals.yaml up -d --wait
pnpm db:migrate
pnpm rag:budget
pnpm knowledge:index
pnpm rag:preflight --remote
```

Indexing makes paid embedding requests.
Skip indexing when an existing index already matches the configured model and articles.
Preflight should report `liveReady: true` and `langsmithAuthenticated: true`.
The $0.50 reservation cap covers this project's OpenRouter requests.
Coding-app usage and LangSmith charges are separate.
Do not reset the ledger to renew the allowance.

## Prepare an isolated starting state

Start from a clean checkout:

```sh
pnpm rag:scenario --id follow-up-01
```

This creates `.worktrees/rag-follow-up-01` from the current commit and applies the recorded historical retrieval configuration there.
The original product source stays healthy.
Preparation starts no agent and makes no model requests.
Use a new ID to create another independent scenario.

Keep the original checkout open in your coding app.
Give the agent `.worktrees/rag-follow-up-01` as its allowed product directory.
Run the evaluation commands below from the original checkout.
They measure the selected product directory using the original evaluation code and questions.

## Measure the starting point

```sh
pnpm rag:check --product .worktrees/rag-follow-up-01 --out evaluations/rag-lab/data/retrieval/baseline.json
```

Exit code 2 means at least one question failed its retrieval rule.
That is an expected starting result for this scenario.
Exit code 1 means the command could not complete and needs attention.

The report contains the actual search query, returned source IDs, and three ranks per question.
A question passes only if the expected approved article ranks first in all three checks.
Every question has one vote in the total score.
The report also records the dataset, corpus, model, contract, and product hashes.

## Give the coding app a goal

Start a native goal in the coding app with this task:

```text
/goal Make every development question retrieve its expected approved article
first in all three checks, while preserving existing passes and product tests.

Work only in .worktrees/rag-follow-up-01.
Read the baseline report in evaluations/rag-lab/data/retrieval/baseline.json.
Investigate the actual queries and source ranks before changing code.

You may change src/lib/ai/help-chat.ts, src/lib/help-chat-config.ts,
and src/lib/knowledge-repository.ts inside the selected worktree.
You may add focused tests under tests/rag-repairs in that worktree.

After each small change, run:
pnpm --dir .worktrees/rag-follow-up-01 test
pnpm rag:check --product .worktrees/rag-follow-up-01
  --baseline evaluations/rag-lab/data/retrieval/baseline.json

The second command is one shell command. Keep its arguments together.
It saves a fresh timestamped report for each measurement.
Use the report as feedback for the next attempt.

Keep the original checkout, existing tests, questions, expected sources,
source articles, evaluators, models, and budget settings unchanged.
Do not hardcode question IDs, questions, or source IDs.
Do not start another coding agent or write an agent runner.

Stop when all checks pass and present the patch for my review.
Stop after three repair attempts or twenty minutes if it is still failing.
Stop earlier if model access, the spending cap, or missing evidence blocks work.
Report the actual evidence and reason for stopping.
Do not commit, merge, or deploy.
```

The coding app chooses the next investigation or edit.
`pnpm rag:check` only measures the current state once and returns a report.
It does not make a repair, start an agent, schedule work, or keep watching.
The turn and time limits in the goal are instructions for the coding app.
The OpenRouter reservation cap is enforced separately by the model transport.

## Check the reserved questions after fixing the patch

After the development goal passes, freeze the proposed patch and run:

```sh
pnpm rag:check --product .worktrees/rag-follow-up-01 --dataset evaluations/rag-lab/retrieval/heldout.json --split heldout
```

Keep these questions outside the repair task.
If the reserved check fails, report it and prepare a fresh untouched set before tuning further.
These small synthetic sets support a repeatable engineering experiment, not a production quality estimate.

Read the patch, product tests, and retrieval reports before accepting the change.
Use `--answers` on a check if you also want generated answer samples for separate review.
Those samples are explicitly unscored and make additional model requests.

## Add a new question

After review, add a new question to `evaluations/rag-lab/retrieval/development.json`.
Each question needs a unique ID, a question, a family, and an expected approved source.
An optional `followUp` preserves the earlier user message.
The two example question files in that directory show the format.

Measure the expanded set into a new baseline file.
Then start a new goal against that baseline and the selected product version.
A completed goal does not automatically watch the dataset for future changes.
For recurring work, configure a separate trigger in your coding app.

Keep comparisons within the same dataset version.
The checker rejects a comparison if the questions, corpus, models, or checking contract changed.

## Other evaluation tools

`pnpm rag:review` starts the human answer-review app at `http://127.0.0.1:4181/`.
It reviews captures created by `pnpm rag:capture`.
Retrieval-only reports are separate from that answer-review queue.

The broader answer-quality evaluator requires real human labels and a validated judge.
See [the evaluation reference](../evaluations/rag-lab/README.md).
