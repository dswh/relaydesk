# Grounded AI reply quality baseline

## Workshop starting state

The reply prompt still receives the real ticket conversation and approved knowledge sources, but three essential grounding rules have been removed. The frozen reply fixtures remain useful, clear, and correctly cited, which isolates prompt-contract regression from model availability or network noise.

## Reproduce

```bash
pnpm eval:ai-replies
```

The command was run three times before this branch was published. Every run produced the same result:

- Frozen tickets evaluated: 5
- Passing cases: 0
- Failing cases: 5
- Failed metric: `prompt_integrity`
- Missing rules: no invented actions, explicit uncertainty, and factual-paragraph citations
- Policy, approved-citation precision, action recall, and deterministic helpfulness remain independently measured

## Loop contract

1. Run `pnpm eval:ai-replies` and inspect the metric-level reasons.
2. Trace the failure through the prompt builder, approved evidence, citation extraction, and reply UI.
3. Make one bounded prompt or generation change.
4. Run the same frozen ticket set again.
5. Stop only when all 5 cases pass every metric, then run `pnpm eval:ai-replies:live` for a model-backed generation and judge check when credentials are available.

Do not edit the frozen tickets, relax metric thresholds, or replace grounded generation with hard-coded answers. The repaired prompt must preserve useful customer actions while preventing unsupported claims.

## Optional live gate

Add `AI_GATEWAY_API_KEY` to `.env.local`, never to a committed file, then run:

```bash
pnpm eval:ai-replies:live
```

The live gate uses the Vercel AI SDK with `anthropic/claude-sonnet-5` for generation and a blinded helpfulness judge. The deterministic workshop gate does not require a paid credential.

## Why this is a strong loop

Prompt quality becomes an executable contract instead of a subjective review. The audience sees the agent optimize against citation precision, action recall, hard policy, safety instructions, and helpfulness across several support cases, with an optional LLM judge as a second evaluation layer.
