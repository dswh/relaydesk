import { generateText, Output } from "ai";
import { z } from "zod";

import { DEFAULT_HELP_JUDGE_MODEL } from "../../src/lib/help-chat-config";
import type { HelpChatAnswer } from "../../src/lib/ai/help-chat";
import {
  evaluateDeterministicGates,
  factCoverage,
  forbiddenClaimCount,
} from "./assertions";
import type { HelpChatEvalCase } from "./dataset";

const judgeSchema = z.object({
  clarity: z.number().int().min(1).max(5),
  completeness: z.number().int().min(1).max(5),
  correctness: z.number().int().min(1).max(5),
  groundedness: z.number().int().min(1).max(5),
  reason: z.string().min(1).max(600),
  relevance: z.number().int().min(1).max(5),
});

export type JudgeScores = z.infer<typeof judgeSchema> & {
  inputTokens: number;
  model: string;
  outputTokens: number;
};

function clampScore(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function heuristicJudge(
  evalCase: HelpChatEvalCase,
  answer: HelpChatAnswer,
): JudgeScores {
  const gates = evaluateDeterministicGates(answer, evalCase);
  const failed = gates.filter((gate) => !gate.pass);
  const coverage = factCoverage(answer.answer, evalCase.requiredFacts);
  const forbidden = forbiddenClaimCount(answer.answer, evalCase.forbiddenClaims);
  const outcomeCorrect = answer.outcome === evalCase.expectedOutcome;
  const citationGate = gates.find((gate) => gate.name === "paragraph_citations")?.score ?? 0;
  const sourceGate = gates.find((gate) => gate.name === "expected_source")?.score ?? 0;
  const wordCount = answer.answer.trim().split(/\s+/).filter(Boolean).length;

  return {
    clarity: clampScore(wordCount > 0 && wordCount <= 450 ? 5 : 3),
    completeness: clampScore(1 + coverage * 4),
    correctness: clampScore(outcomeCorrect && forbidden === 0 ? 5 : 2),
    groundedness: clampScore(
      answer.outcome !== "answered" ? (outcomeCorrect ? 5 : 2) : 1 + Math.min(citationGate, sourceGate) * 4,
    ),
    inputTokens: 0,
    model: "deterministic-reference-judge-v1",
    outputTokens: 0,
    reason:
      failed.length === 0
        ? "The deterministic reference judge found the answer complete, grounded, and policy-safe."
        : `Failed gates: ${failed.map((gate) => gate.name).join(", ")}.`,
    relevance: clampScore(outcomeCorrect ? 5 : 2),
  };
}

function judgePrompt(evalCase: HelpChatEvalCase, answer: HelpChatAnswer) {
  const evidence = answer.retrieved
    .map(
      (chunk) =>
        `SOURCE ${chunk.sourceId}\nTitle: ${chunk.title}\nSection: ${chunk.heading}\n${chunk.content}`,
    )
    .join("\n\n");

  return `You are a blinded evaluator for a customer-facing support answer.

Score each dimension from 1 to 5:
- correctness: The answer agrees with the reference and contains no false product claim.
- groundedness: Factual claims are supported by the retrieved evidence.
- completeness: The answer covers the required facts appropriate to the expected outcome.
- relevance: The answer directly handles the user's request and expected behavior.
- clarity: The answer is concise, understandable, and actionable.

Do not infer product facts that are absent from the evidence. Do not reward fluency for an unsupported claim. The reference answer is an interpretation target, not required wording.

Question:
${evalCase.question}${evalCase.followUp ? `\nFollow-up: ${evalCase.followUp}` : ""}

Expected outcome: ${evalCase.expectedOutcome}
Reference answer: ${evalCase.referenceAnswer}
Required facts: ${evalCase.requiredFacts.map((fact) => fact.join(" OR ")).join("; ") || "None"}
Forbidden claims: ${evalCase.forbiddenClaims.join("; ") || "None"}

Retrieved evidence:
${evidence || "No approved evidence was retrieved."}

Candidate answer:
${answer.answer}`;
}

export async function judgeHelpAnswer(
  evalCase: HelpChatEvalCase,
  answer: HelpChatAnswer,
  { live }: { live: boolean },
): Promise<JudgeScores> {
  if (!live) return heuristicJudge(evalCase, answer);
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for the live help-chat judge.");
  }

  const model = process.env.RELAYDESK_HELP_JUDGE_MODEL ?? DEFAULT_HELP_JUDGE_MODEL;
  const result = await generateText({
    model,
    output: Output.object({ schema: judgeSchema }),
    prompt: judgePrompt(evalCase, answer),
  });
  const judged = result.output;
  return {
    ...judged,
    inputTokens: result.totalUsage.inputTokens ?? 0,
    model,
    outputTokens: result.totalUsage.outputTokens ?? 0,
  };
}
