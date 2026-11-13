# Recorded retrieval improvement

Open [report.html](report.html) for the complete read-only replay.
It opens directly from disk and makes no model or API requests.
[report.json](report.json) contains the measurements, patch, trace IDs, runtime versions, and flow-control proof.

This evidence was captured on 13 November 2026.
The implementation is on `codex/rag-loop-reproducible-demo`.
Run ID: `workshop-proof-07`.
Measured source commit: `530343e9d4a309e1a4a00c3edfb15318a9b5548d`.

| Check | Before | After |
| --- | --- | --- |
| Development questions with the expected approved source first | 4/6 | 6/6 |
| Held-out questions with the expected approved source first | 1/3 | 3/3 |
| Previously passing questions that regressed | 0 | 0 |

Every question had three live retrieval checks in each state.
The single candidate restored conversation context to the retrieval query.
It also added three focused regression tests.
The measured candidate passed all 54 tests across 10 files.
Two retrieval trace records were read back from LangSmith and confirmed complete.

The patch is awaiting engineer review.
No human verdict or engineering approval was fabricated.
Answer quality remains unscored.
A source-ranking score does not establish answer correctness or judge quality.
This small synthetic set demonstrates a shared correction, not general production performance.

The held-out questions were measured after the candidate patch was frozen.
They are now visible in this replay.
Use fresh untouched held-out questions when testing new tuning decisions.

A seventh development question was then added while review was pending.
Running the controller again made zero additional model requests.
The saved comparison still covers six questions.
The next permitted measurement establishes a new dataset version.

The original patch renderer omitted the newly created test file.
The complete patch in this replay was reconstructed from the unchanged measured worktree.
The original artifact and reconstruction receipt remain in the private run directory.
No measurements or scores were changed.

Earlier rehearsals exposed setup issues with dependency links, CLI model aliases, and inherited database settings in unit tests.
Those issues were fixed before this successful run.
Their logs remain in the ignored local evidence directory.
They are not presented as product-repair experiments.

Follow the [reproduction runbook](../../../evaluations/rag-lab/demo/README.md) to create a fresh isolated scenario.
Use a new run ID.
Keep the shared spending ledger and fixed evaluation contract.
The recorded versions and hashes support repeating the procedure.
Provider output and the coding agent's chosen patch can still vary.

The final feature source also passed `pnpm verify`.
That check included lint, TypeScript, API contract checks, 52 unit tests, both existing five-case fixture evaluations, and the production build.
These fixture evaluations are separate from the live retrieval results above.

The OpenRouter account usage increased by about $0.018 during implementation and rehearsals.
[cost-summary.json](cost-summary.json) records the usage snapshot and the unchanged $0.50 cap.
Codex plan usage is separate.
