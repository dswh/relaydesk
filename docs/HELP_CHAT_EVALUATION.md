# Help-chat evaluation

- Measure the same help-answer path used by the product.
- Keep retrieval, citation, policy, refusal, and written-answer judgments separate.

The fixed tasks are in `evaluations/help-chat/dataset.yaml`.
Each task records the expected source, response route, reference behavior, and protected constraints.

```sh
pnpm eval:help-chat:deterministic
pnpm eval:help-chat:promptfoo
```

These commands check the retrieval and response contracts using deterministic fixtures.
They do not prove live written-answer quality.

```sh
pnpm eval:help-chat:live
pnpm eval:help-chat:report
```

Live evaluation requires configured model access and makes paid requests.
Reports are saved under `evaluations/help-chat/runs/`.
Keep questions, reference behavior, graders, model settings, and thresholds fixed during a comparison.

For trace capture, human review, and judge calibration, read `evaluations/rag-lab/README.md`.
For a bounded retrieval repair with native coding-app goals, read [RAG retrieval improvement](RAG_LOOP.md).
