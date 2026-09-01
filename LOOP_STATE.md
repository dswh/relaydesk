# Customer help-chat loop state

Record one row per bounded iteration. Keep the evaluation dataset, expected sources, reference answers, judge rubric, judge model, and thresholds unchanged during a run.

| Iteration | Hypothesis | One change | Affected cases | Score delta | Regressions | Latency and tokens | Next decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Frozen baseline | None | Full suite | Record from `pnpm eval:help-chat:deterministic` | Record failing segments | Record report totals | Select the largest shared failure cluster |
