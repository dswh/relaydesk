# Workshop deck, version 27

This version teaches how to set up an improvement loop around a RAG pipeline.
It keeps the 43-slide deck and the 14-slide guided hands-on segment.
Slides 16 to 30 follow one practical problem: a short follow-up loses the earlier topic during search.

The [session review](session-review.html) assesses the full storyline and use cases.
Its recommendations have not been applied to this deck.

The focus is the repeated engineering work:

- Record the question, query, retrieved sources, and answer.
- Define an expected approved source for each question.
- Protect questions that already pass.
- Give Codex one bounded repair task in a separate worktree.
- Run the product tests and fixed retrieval checks after each proposal.
- Review the answer and patch separately.
- Watch for new questions and start a fresh comparison after review.

The slides use actual screenshots from `workshop-proof-07`.
They do not present the retrieval score as answer correctness.
The screenshots contain synthetic product questions and no credentials.
No additional model calls are needed to rebuild the presentation.

## Files

`source-v26.pptx` preserves the input deck.
`update-deck.mjs` is the reusable Artifact Tool callback that edits it.
`assets/` contains the captured controller excerpts.
`slide-text.json` records the slide copy and transitions.
`rebuild.mjs` imports the preserved source, applies the changes, validates the PPTX, renders every slide, and builds the HTML viewer.
`build-html.py` reads PPTX text, tables, notes, and slide images for the HTML companion.

The learner commands refer to the same dedicated branch:
`codex/rag-loop-reproducible-demo`.
Use the [demo runbook](../../../evaluations/rag-lab/demo/README.md) for database, model, and LangSmith setup.

## Rebuild inside Codex

Use the Presentations skill and the bundled runtime returned by `load_workspace_dependencies`.
Pass those verified paths to the command below.
Choose a new output directory because the validator preserves existing files.

```sh
node docs/workshop/v27/rebuild.mjs \
  --runtime-modules <bundled-node-modules> \
  --skill-dir <presentations-skill-directory> \
  --python <bundled-python-executable> \
  --out <new-output-directory>
```

The callback can also run in an Artifact Session that has imported `source-v26.pptx`:

```js
const module = await import('/absolute/path/to/update-deck.mjs');
await artifactSession.run(module.updateDeck, { artifactRef });
```

Inspect the changed slide renders before delivery.
The shared source and assets make the edits reproducible without requiring a past chat session.
