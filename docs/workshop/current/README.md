# Current workshop source

The 43-slide deck follows one engineering problem from a failed follow-up through a small repair, review, and a fresh check when a new question arrives.

Slides 17 to 30 preserve the seven-step guided hands-on segment.
Slide 16 starts the workflow before the walkthrough.
Slide 31 says only "Short Break".
Slides 38 to 41 guide the learner exercise.
Slide 42 debriefs the work before the single closing slide.

The source is on `codex/rag-loop-reproducible-demo`.

## Edit and rebuild

`source.pptx` is the protected input for this revision.
It is the prior current deck, not an alternative presentation to edit.
`update-deck.mjs` contains the content and layout changes.
`assets/` holds screenshots from the actual controller and saved evidence.
The generated deck uses Calibri on a 1280 by 720 canvas.
The data table on slide 20 remains a native editable table.
The control diagrams and their connectors remain editable.

Use Artifact Session for live authoring.
Apply `updateDeck` to an imported `source.pptx` once, or apply its three ranges to the same live session.
Do not apply the update twice to an already revised deck.

For an independent reproducibility check, use the bundled Artifact Tool runtime and a new output directory:

```sh
node docs/workshop/current/rebuild.mjs \
  --runtime-modules /absolute/path/to/node_modules \
  --skill-dir /absolute/path/to/presentations-skill \
  --python /absolute/path/to/python3 \
  --out /absolute/path/to/new-output-folder
```

The output directory must have no existing final PowerPoint.
The finalizer refuses to overwrite it.
The rebuild makes no model calls.
It validates package integrity, geometry, typography, slide count, native table ownership, and Artifact Tool import.
It also builds the standalone HTML deck and copies the guides and recorded replay.

The stable deliverable names are:

- `Loop_Engineering_Workshop_Deck.pptx`
- `loop-engineering-workshop.html`
- `rag-hands-on.html`
- `practical-prompts.html`
- `rag-demo-replay.html`

Research provenance lives in `internal/research-provenance.json`.
Learner slides, speaker notes, and guides omit research citations and external resource lists.
`slide-text.json` records the current speakable notes and transitions.

## RAG continuation

Read `evaluations/rag-lab/demo/README.md` from the repository root for the live setup.
Use a fresh run ID for each rehearsal.
The prepared scenario stays in its own worktree.
The healthy source branch stays intact.

The two-run replay in `docs/evidence/rag-continuation/` records the completed continuation.
Its first engineering decision explicitly identifies Codex as an automated reviewer.
D08 was added after that decision.
The watcher then checked all eight active questions.
No further patch was needed.
An unchanged watcher pass made no model calls.

The automatic goal is expected-source ranking.
Answer quality remains unscored.
No merge or deployment is part of the demonstration.
