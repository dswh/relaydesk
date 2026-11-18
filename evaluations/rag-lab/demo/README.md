# Reproducible RAG retrieval improvement

This implementation is on `codex/rag-loop-reproducible-demo`.
It supports the seven guided workshop steps on slides 17 to 30.
Attendees should begin with the [hands-on setup guide](../../../docs/workshop/START_HERE.md) and its blank `.env.workshop.example` file.

The recorded live proof is in [`docs/evidence/rag-retrieval-proof`](../../../docs/evidence/rag-retrieval-proof/README.md).
It improved development retrieval from 4/6 to 6/6 and held-out retrieval from 1/3 to 3/3.
Each question was checked three times before and after the change.
All previously passing questions stayed passing.
The original repair snapshot waits for review.
The newer [continuation replay](../../../docs/evidence/rag-continuation/report.html) preserves the subsequent automated engineering review and the fresh eight-question check.
Answer quality remains unscored.

The product remains healthy in this branch.
Preparation creates a separate scenario worktree.
It restores the missing conversation-context behavior and shallow two-chunk retrieval documented in historical commit `53c2749887d4f3f9ba815acd105586bd25a67e05`.
That historical version searched only the latest user message and retrieved two chunks.
A vague follow-up can therefore lose the topic needed to find the correct document.
The scenario patch and source commit are recorded for each run.
The exact historical configuration source and its SHA-256 are committed in `historical-config.json`, so preparation does not require an otherwise unreachable Git object.
No failure flag or workshop UI is added to the customer product.

## What the score proves

The contract is expected approved source at rank one, in three live retrievals per question.
Each question gets one vote.
Six development questions guide the correction.
Three held-out questions test it after the candidate patch is frozen.
The held-out question details are omitted from the coding-agent prompt and removed from its candidate checkout.
They remain in the trusted harness repository, so this is procedural separation, not a security boundary against an adversarial agent reading repository history.

These are synthetic questions about a small real product corpus.
This is a workshop demonstration, not an unbiased production-quality estimate.

Actual answer samples are generated once per question and preserved with LangSmith trace IDs.
Answer quality remains unscored.
A ranking pass does not prove that an answer is correct, complete, or grounded.
The full `rag:loop` quality runner still requires human labels and a calibrated judge.
This demo does not weaken or bypass that gate.

## Prepare a fresh environment

Use Node 22 or newer, pnpm 10.10, Docker, Git, and an authenticated Codex CLI.
Install exactly the dependencies in the lockfile.
Keep credentials in the ignored `.env.local` file.
Start from `.env.rag.example` and configure the existing workspace-scoped LangSmith key and OpenRouter key privately.
Use live embeddings for both indexing and queries.

```sh
pnpm install --frozen-lockfile
docker compose -f compose.rag-evals.yaml up -d --wait
pnpm db:migrate
# Set RELAYDESK_HELP_EMBEDDING_MODE=gateway before indexing.
pnpm knowledge:index
pnpm rag:preflight
pnpm rag:budget
```

Pin the generation model to `openai/gpt-4.1-mini` and the embedding model to `openai/text-embedding-3-small`.
Pin the upstream provider to OpenAI.
Unset `RELAYDESK_HELP_INCLUDE_CONTEXT` so the measured code determines the behavior.
The model IDs, routing, corpus, dataset, code commit, contract, and repeated observations are recorded.
Provider outputs can still vary; reproducing the procedure does not promise byte-identical model output.

Set `RELAYDESK_MODEL_BUDGET_USD=0.50` and `RELAYDESK_MODEL_BUDGET_FILE` to the existing shared absolute ledger path.
The ledger is never reset or copied into a fresh allowance.
OpenRouter reservations cover this transport's embedding and generation calls.
The Codex CLI uses the current Codex plan separately and is limited to one process at a time with a three-minute deadline per attempt.
The whole run allows three candidates or 20 minutes.
The invocation ignores the user configuration file while retaining account authentication and the workspace-write sandbox.
This prevents an unsupported desktop model alias from breaking the CLI.
The CLI uses its supported account default. Global configuration is unchanged.

## Run the workshop

Commit local implementation changes first.
Use a new run ID each time so earlier evidence is preserved.

```sh
pnpm rag:demo prepare --id workshop-01
pnpm rag:demo run --id workshop-01
RAG_REVIEW_PORT=4181 pnpm rag:review
```

Open `http://127.0.0.1:4181/demo`.
Use `--retrieval-only` on the run command to omit generation of answer samples.
Retrieval still uses the live embedding model and database.
There is no fixture path that can claim the retrieval goal was achieved.

The controller measures the starting development set.
Codex receives those failed examples and the repair skill.
The candidate can change only three RAG implementation files and focused repair tests.
The runner checks scope, a 100-line change limit, the full product unit suite, repeated development retrievals, and held-out regressions.
Product unit tests use an isolated environment without live database credentials, model keys, or app overrides.
The healthy source unit suite runs before paid measurement, so a setup failure does not trigger repeated coding attempts.
The historical scenario may fail its existing conversation-context unit test; that is the behavior the candidate must repair.
Every candidate must pass the full unmodified unit suite.
It keeps previously passing questions and rejects more failed repetitions.
An improved candidate waits for engineer review.
It is never merged, published, deployed, or marked human-approved automatically.

Inspect the recorded patch, model answer samples, product test log, and rank tables.
The demo page can save a real reviewer verdict and critique for a development answer.
Those records stay separate from judge calibration and engineering acceptance.
Reusable implementation guidance comes from the existing `feedback.md` file.
Then a responsible engineer can run one review command:

```sh
pnpm rag:demo accept --id workshop-01 --reviewer "Your name" --reviewer-type human --reason "Record your actual code and evidence review here."
# Or:
pnpm rag:demo reject --id workshop-01 --reviewer "Your name" --reviewer-type human --reason "Record why this proposal needs another attempt."
```

Each engineering decision records the reviewer, review type, rationale, and time.
Use `--reviewer-type assistant` when an automated reviewer performs the code review.
Do not present that record as a human answer-quality label.
Acceptance selects the exact measured local worktree as the next baseline.
It does not change the healthy source branch or claim answer-quality approval.

## Show new-question flow control

While the candidate awaits review:

```sh
pnpm rag:demo add-question --id workshop-01 --file evaluations/rag-lab/demo/new-question.json
pnpm rag:demo run --id workshop-01
```

The second command returns at the review gate before a model call.
After the review is resolved, add the next prepared question and let the watcher establish a fresh baseline:

```sh
pnpm rag:demo add-question --id workshop-01 --file evaluations/rag-lab/demo/after-review-question.json
pnpm rag:demo watch --id workshop-01 --once
```

`--once` stops after one permitted watcher pass.
Omit it to keep watching.
The earlier comparison is archived separately from the new dataset.
If the current pipeline already handles the new questions, the loop records the check and makes no code change.
Old and new dataset totals are never treated as a paired before-and-after comparison.

For continuous source and question monitoring:

```sh
pnpm rag:demo watch --id workshop-01
```

The watcher stays quiet while unchanged and waits without model calls during a pending review.
It stops repeating repairs on a blocked or bounded run.
Use Ctrl+C to stop it.
The original calibrated quality runner additionally supports periodic quality sweeps after success.

## Evidence and reset

Each measurement round has its own saved reports and engineering decision.
The controller page can switch between the initial repair and the later check.
Each run is under the ignored `evaluations/rag-lab/data/retrieval-demo/<id>/` directory.
It contains the baseline patch, versioned question sets, repeated rank measurements, real answer samples, Codex log, product test log, candidate patch, decisions, and state transitions.
No expert labels are invented.
No model output is presented as human approval.

Use a new ID to reproduce from the same committed source state.
Existing worktrees and evidence are retained.
Never delete or reset the spending ledger to make another run pass.
If the held-out check fails, review the failure and use a fresh untouched set before tuning further.
Do not repeatedly optimize against the published held-out questions.

## Slide mapping

| Slides | Show |
| --- | --- |
| 17 and 18 | The original follow-up, actual query, document ranks, and LangSmith trace. |
| 19 and 20 | Fixed question set, three repetitions, per-question ranking score, and unchanged answer-quality label. |
| 21 and 22 | The selected follow-up-context failure family and the original query that lost its topic. |
| 23 and 24 | Codex instructions, allowed files, and the actual small candidate patch. |
| 25 and 26 | The real baseline, candidate, product test log, and frozen held-out comparison. |
| 27 and 28 | Inspect the recorded code decision and explicit reviewer type. Keep answer-quality labels separate. |
| 29 and 30 | Show the pending-review pause, resolve review, add D08, and inspect the fresh eight-question run. |

Start the prepared workflow on slide 16, before the seven-step walkthrough.
The current slide screenshots use the real retrieval repair and continuation evidence.
The automatic goal covers source ranking. Answer quality remains a separate review.

The current deck and learner guide are in `docs/workshop/current/`.

## Replay without more model calls

```sh
pnpm rag:demo export --id workshop-01 --out docs/evidence/rag-retrieval-proof
```

Open the exported `report.html` for a read-only replay of the real recorded measurements.
Its label distinguishes recorded evidence from a fresh live run.
It cannot send a model request or save an approval.
The export omits machine-specific state paths and includes the actual candidate patch and trace identifiers.
