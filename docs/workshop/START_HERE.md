# Loop Engineering hands-on

- Build a loop that finds a failed support question, asks Codex for a small repair, checks it, and waits for your review.
- After review, add a new question and let the loop check the pipeline again.
- The automatic score measures retrieval. It does not establish that the written answer is correct.

## What problem are we solving?

A customer asks about duplicate webhook deliveries.
Then they ask, "What should I do next?"

The earlier version of the search uses only that follow-up.
It can lose the topic and retrieve the wrong article.

The loop investigates the shared cause and proposes a change.
It must preserve the questions that already work.
You inspect the evidence before accepting the proposed code.

## Start with the replay

You can inspect the recorded demonstration without credentials or model requests.
After cloning the repository, open this file in your browser:

```text
docs/workshop/current/rag-demo-replay.html
```

The replay contains a real repair, its engineering review, and the later check on eight questions.
The recorded review is explicitly marked as an automated engineering review.
It is separate from human answer review.

The [slide deck](current/Loop_Engineering_Workshop_Deck.pptx), [HTML deck](current/loop-engineering-workshop.html), and [hands-on companion](current/rag-hands-on.html) are included.
Download or open the HTML files locally to view them.

## What you need for a live run

- Node.js 22 or newer and pnpm 10.10.0.
- Git and Docker with Compose.
- An installed Codex CLI, authenticated with your own account.
- Your own funded OpenRouter key.
- Your own LangSmith workspace and API key.

Codex makes the code change.
OpenRouter supplies embeddings and answer samples.
LangSmith records traces.
The local runner calculates the retrieval score and applies the acceptance checks.

The local OpenRouter cap defaults to $0.50 across indexing and later model requests.
It uses conservative reservations, so it can stop before that amount is actually billed.
Codex usage and any LangSmith charges are separate.

## 1. Clone the workshop branch

```sh
git clone --branch codex/rag-loop-reproducible-demo --single-branch https://github.com/dswh/relaydesk.git
cd relaydesk
pnpm install --frozen-lockfile
codex login status
```

If Codex is not authenticated, run `codex login` before continuing.

## 2. Configure your own environment

In a fresh clone:

```sh
cp .env.workshop.example .env.local
```

If you already have `.env.local`, keep it and compare it with the example.
Do not overwrite existing credentials.

Edit `.env.local` and fill in:

- `OPENROUTER_API_KEY`: your funded key.
- `LANGSMITH_API_KEY`: your own workspace key.
- `LANGSMITH_ENDPOINT`: the API endpoint for your workspace's region.
- `LANGSMITH_WORKSPACE_ID`: your workspace ID, if required by your account.
- `RELAYDESK_MODEL_BUDGET_FILE`: an absolute path inside this clone, ending in `evaluations/rag-lab/data/model-budget.json`.

Run `pwd` to see the absolute path to your clone.
For example, a clone at `/home/learner/relaydesk` uses:

```dotenv
RELAYDESK_MODEL_BUDGET_FILE=/home/learner/relaydesk/evaluations/rag-lab/data/model-budget.json
```

Create a tracing project named `relaydesk-loop-workshop` in your LangSmith workspace.
The example uses project addressing, so leave `LANGSMITH_AGENT_ID` empty.
Keep `RELAYDESK_HELP_INCLUDE_CONTEXT` unset so the measured code controls conversation handling.

Your keys, spending ledger, and live run data are ignored by Git.
Keep the same ledger across rehearsals and run IDs.

## 3. Start the database and index the articles

Start Docker, then run:

```sh
docker compose -f compose.rag-evals.yaml up -d --wait
pnpm db:migrate
pnpm rag:budget
pnpm knowledge:index
pnpm rag:preflight --remote
```

Indexing makes paid embedding requests.
Index once for this setup.
Repeat it only if the articles or embedding model change, or the index is missing.

Continue when preflight reports `liveReady: true` and `langsmithAuthenticated: true`.
If the cap stops the setup, inspect `pnpm rag:budget`.
Do not remove the ledger or silently increase the limit.

## 4. Open the controller

In Terminal 1:

```sh
RAG_REVIEW_PORT=4181 pnpm rag:review
```

Keep it running and open `http://127.0.0.1:4181/demo`.
You do not need to start the customer-facing Next.js app.

## 5. Start the improvement loop

In Terminal 2, from the same repository:

```sh
pnpm rag:demo prepare --id workshop-01
pnpm rag:demo run --id workshop-01
```

Use the same run ID for every remaining command.
For another rehearsal, use a new ID such as `workshop-02`.

Preparation creates a separate scenario worktree with the historical search behavior.
Your source branch stays intact.
The runner prepares the repair task and starts Codex itself.
You do not write another prompt for each handoff.

To omit generated answer samples and use fewer model requests, add `--retrieval-only` to both `run` and later `watch` commands.
Retrieval still uses live embeddings.

## Follow the seven steps

Slides 17 to 30 are fourteen guided hands-on slides.
Each introduction is followed by an application.
Start the run on slide 16, then inspect its evidence as you continue.

| Slides | Step | What to inspect |
| --- | --- | --- |
| 17 and 18 | Sensor | Select the first run, before the change, and D03. Compare the earlier question with the actual search query and returned sources. |
| 19 and 20 | Regression protection | Inspect `evaluations/rag-lab/demo/development.json`. The expected approved article must rank first in all three checks. Existing passes must remain passing. |
| 21 and 22 | Controller | Inspect the selected failure. The recorded run selected D01. Compare D01 and D03 to look for a shared missing topic. |
| 23 and 24 | Actuator | Inspect the actual patch and focused tests. Codex may change only the named RAG files and add focused repair tests. |
| 25 and 26 | Workflow execution | Inspect the saved history, product tests, repeated retrieval checks, and the reserved questions checked after the patch is frozen. |
| 27 and 28 | Human feedback | Read the patch, checks, and saved answer. Leave the engineering decision pending until the next step. |
| 29 and 30 | Flow control | Queue a question during review. Resolve the review, add another question, and watch the next permitted check. |

Six questions guide the initial repair.
Three additional questions stay outside the repair prompt for the later regression check.
The total is `100 * passing questions / measured questions`.
A question passes only when its expected approved article ranks first in all three retrieval attempts.

## 6. Show the review pause

Wait until the initial command finishes and the controller says `awaiting_review`.
Then run:

```sh
pnpm rag:demo add-question --id workshop-01 --file evaluations/rag-lab/demo/new-question.json
pnpm rag:demo run --id workshop-01
```

D07 is now queued.
The second command waits at the review gate before measurement or model calls.

In the controller, expand **Review the code change**.
Enter your name, choose **Human engineering review**, and record your actual reasoning.
Accept the proposed code only after inspecting the patch and its checks.
Otherwise, reject it and investigate the reason.

Acceptance selects the exact measured worktree as the next local baseline.
It does not merge, deploy, or approve answer quality.

Use **Review this saved answer** for a separate answer verdict.
If a review produces a reusable repair lesson, write the approved guidance in `evaluations/rag-lab/feedback.md`.
The next repair prompt reads that file.
Saving an engineering review reason alone does not update the repair instructions.

## 7. Add a question after review

After resolving the engineering review:

```sh
pnpm rag:demo add-question --id workshop-01 --file evaluations/rag-lab/demo/after-review-question.json
pnpm rag:demo watch --id workshop-01 --once
```

D08 asks which dates cover a complete calendar month in a usage export.
The watcher measures all eight active questions using the selected baseline.

In the recorded run, the accepted pipeline already handled them.
No additional patch was needed.
A fresh live result may differ.
Inspect the actual result rather than assuming the same outcome.

Select the second run and D08 in the controller.
Keep this fresh eight-question check separate from the original six-question before-and-after comparison.

## Keep watching, or stop

```sh
pnpm rag:demo watch --id workshop-01
```

The watcher checks for changes in the run's questions and measured source.
With unchanged inputs, it waits without model calls.
A pending review blocks another repair.
Use Ctrl+C to stop the watcher.

Each repair run allows at most three candidates or 20 minutes.
Configuration problems and exhausted limits need attention.
Check the reason with:

```sh
pnpm rag:demo status --id workshop-01
pnpm rag:budget
```

Use a fresh run ID to repeat the procedure.
Preserve earlier evidence and the shared spending ledger.

## Save your own replay

```sh
pnpm rag:demo export --id workshop-01 --out docs/evidence/my-workshop-run
```

Open the exported `report.html` locally.
It is read-only and cannot call a model or save an approval.

Inspect exported material before sharing it.
Commit only synthetic examples and evidence you intend to publish.

The [full runbook](../../evaluations/rag-lab/demo/README.md) explains the allowed changes, measurement rules, and recorded evidence in more detail.
