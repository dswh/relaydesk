# SignalDesk agent instructions

This repository is a controlled teaching fixture. Read `SCENARIO.md` and the linked loop contract before changing anything.

## Working rules

- Work on a disposable `run/...` branch or an isolated worktree, never directly on a `demo/...` seed branch.
- Make one small, coherent correction per iteration.
- Treat scripts in `scripts/` as sensors and gates. Do not weaken or bypass them.
- Existing tests are part of the verifier. You may add a regression test, but do not delete, skip, or loosen an existing test.
- Keep `LOOP_STATE.md` current after every attempt.
- Stop when the scenario succeeds, the same failure repeats twice, three repair attempts fail, or 25 minutes pass.
- Do not push, merge, publish, deploy, or contact external systems without explicit human approval.
- If a verifier appears wrong, stop and report the evidence instead of editing the verifier.

## Required handoff

Report the selected unit, baseline evidence, files changed, commands run, final evidence, remaining risks, and why the loop stopped.

