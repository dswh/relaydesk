# RAG retrieval improvement

- Investigate support follow-ups that lose their earlier topic during search.
- Use a coding agent to make small changes and run the same retrieval checks after each change.
- The score measures source ranking. Written answer quality remains a separate review.

## Setup

- Open Docker Desktop and wait for the engine to start.
- Open your clone in a local Claude Code Desktop session.
- Send one prompt at a time as a regular message.
- Check each result before moving on.

### 1. Install the project

```text
Check that Git, Node.js 22 or newer, pnpm 10.10.0, and Docker Compose are available.
Use the codex/rag-loop-reproducible-demo branch.
Preserve any local changes.
Install the dependencies from the lockfile.
Report the active branch and stop.
```

**Check** that Claude reports the branch and a successful install.

### 2. Connect OpenRouter and LangSmith

```text
Prepare my ignored local settings from .env.rag.example.
Keep existing keys private and preserve their values.
Use the dedicated RAG database settings.
Show me which settings still need my input and where to enter them.
Keep key values out of chat.
Stop so I can fill in any missing settings.
```

- Add your OpenRouter and LangSmith keys to `.env.local`.
- Use the `relaydesk-rag` tracing project in your LangSmith workspace.
- Create the project in LangSmith if it is missing.
- Use your region's API endpoint and workspace ID if required.
- Leave `LANGSMITH_AGENT_ID` empty when using a project.
- Leave `RELAYDESK_HELP_INCLUDE_CONTEXT` unset so the app controls it.
- **Check** that Claude confirms the required settings are present.

### 3. Prepare the database and search index

```text
Start the dedicated Docker database and apply pending migrations.
Check the index against the approved articles and configured embedding model.
Build it only if it is missing or out of date.
Run the readiness check with LangSmith access enabled.
Show the readiness result and stop.
```

- **Check** that Docker shows the database as healthy.
- Look for five articles and ten indexed sections.
- Look for `liveReady: true` and `langsmithAuthenticated: true`.

### 4. Open the isolated app preview

```text
Prepare a fresh historical retrieval scenario with ID follow-up-01.
If that ID is taken, pick a new one and leave existing copies intact.
Start the copy with Webpack, using my local settings from the original checkout.
Keep credentials in the original checkout.
Share the copy path and landing-page link.
Stop before running evaluations.
```

- **Check** that the landing page opens.
- Click **Ask RelayDesk** in the navbar.
- Ask how to handle duplicate webhook deliveries.
- Look for **Webhook delivery and retries** under **Sources**.

The examples below use `.worktrees/rag-follow-up-01`.
If Claude reports a different path, use that path for each check.
Keep the original checkout open in your coding app.
Measure from the original checkout and point each check at the isolated copy.
Use a fresh scenario ID to start again from the historical state.
The [evaluation reference](../evaluations/rag-lab/README.md) lists the underlying project tasks.

## Use the search questions in LangSmith

The six questions and their expected articles are in [development.json](../evaluations/rag-lab/retrieval/development.json).
Send this as a regular Claude Code message after setup:

```text
Publish the six search questions to my LangSmith workspace.
Give me the dataset link and show the six questions.
```

The publisher creates a private, versioned dataset in your workspace.
Open its **Examples** tab to see each question and expected source.
Ask Claude to use that dataset for the baseline and each repair check.
The checker reads the questions from LangSmith and saves the ranks and total locally.
It verifies that the question set stays the same during the check and across comparisons.
See the [underlying project tasks](../evaluations/rag-lab/README.md#retrieval-checks).

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
source articles, evaluators, and models unchanged.
Use the same question set as the baseline, as recorded in the report.
Do not hardcode question IDs, questions, or source IDs.
Do not start another coding agent or write an agent runner.

Stop when all checks pass and present the patch for my review.
Stop after three repair attempts or twenty minutes if it is still failing.
Stop earlier if model access or missing evidence blocks work.
Report the actual evidence and reason for stopping.
Do not commit, merge, or deploy.
```

The coding app chooses the next investigation or edit.
`pnpm rag:check` only measures the current state once and returns a report.
It does not make a repair, start an agent, schedule work, or keep watching.
The turn and time limits in the goal are instructions for the coding app.

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
If you use LangSmith, publish the expanded file as its own dataset.
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
