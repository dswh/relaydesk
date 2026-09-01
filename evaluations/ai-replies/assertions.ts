import { config } from "dotenv";
import { generateText } from "ai";

import { DEFAULT_RELAYDESK_MODEL } from "../../src/lib/ai/grounded-reply";

config({ path: ".env.local", quiet: true });

type AssertionContext = {
  providerResponse?: { metadata?: Record<string, unknown> };
  vars: Record<string, unknown>;
};

type ReplyPayload = {
  citationIds: string[];
  text: string;
};

function parse(output: string): ReplyPayload {
  return JSON.parse(output) as ReplyPayload;
}

function result(pass: boolean, score: number, reason: string) {
  return { pass, reason, score };
}

export function policyCompliance(output: string) {
  const { text } = parse(output);
  const prohibited = [
    /guarantee(?:d)?/i,
    /send (?:me|us) your password/i,
    /credit card number/i,
    /social security number/i,
    /refund (?:has been|was) issued/i,
  ];
  const violation = prohibited.find((pattern) => pattern.test(text));
  return result(!violation, violation ? 0 : 1, violation ? `Policy phrase matched ${violation}` : "No hard-policy violation detected.");
}

export function promptIntegrity(_output: string, context: AssertionContext) {
  const prompt = String(context.providerResponse?.metadata?.prompt ?? "");
  const requiredRules = [
    "Use only the conversation",
    "Do not invent actions, timelines, refunds, product behavior, or investigation results",
    "State uncertainty instead of filling an evidence gap",
    "End every factual paragraph with one or more source markers",
  ];
  const missingRules = requiredRules.filter((rule) => !prompt.includes(rule));
  const sourceIds = String(context.vars.allowedCitations).split(",");
  const missingSources = sourceIds.filter((id) => !prompt.includes(`SOURCE ${id}`));
  const pass = missingRules.length === 0 && missingSources.length === 0;
  return result(
    pass,
    pass ? 1 : 0,
    pass
      ? "The frozen safety and grounding contract is present."
      : `Missing ${[...missingRules, ...missingSources].join(", ")}.`,
  );
}

export function citationPrecision(output: string, context: AssertionContext) {
  const { citationIds } = parse(output);
  const expected = new Set(String(context.vars.allowedCitations).split(","));
  const supported = citationIds.filter((id) => expected.has(id));
  const score = citationIds.length ? supported.length / citationIds.length : 0;
  return result(score >= 0.95, score, `${supported.length} of ${citationIds.length} citations use approved sources.`);
}

export function actionRecall(output: string, context: AssertionContext) {
  const { text } = parse(output);
  const actions = String(context.vars.requiredActions)
    .split(";")
    .map((action) => action.split("|").map((phrase) => phrase.trim().toLowerCase()));
  const normalized = text.toLowerCase();
  const recalled = actions.filter((alternatives) => alternatives.some((phrase) => normalized.includes(phrase)));
  const score = recalled.length / actions.length;
  return result(score >= 0.9, score, `${recalled.length} of ${actions.length} required actions are present.`);
}

export async function helpfulness(output: string) {
  const { text } = parse(output);
  if (process.env.RELAYDESK_EVAL_MODE !== "live") {
    const words = text.trim().split(/\s+/).length;
    const score = words >= 30 && words <= 150 ? 1 : 0;
    return result(score === 1, score, `The customer-ready reply contains ${words} words.`);
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return result(false, 0, "AI_GATEWAY_API_KEY is required for the live judge.");
  }

  const judgePrompt = `Score this support reply from 1 to 5 for clarity, completeness, and usefulness.
Do not reward unsupported certainty. Return JSON only as {"score": number, "reason": string}.

Reply:
${text}`;
  const judged = await generateText({
    model: process.env.RELAYDESK_AI_JUDGE_MODEL ?? DEFAULT_RELAYDESK_MODEL,
    prompt: judgePrompt,
  });
  const parsed = JSON.parse(judged.text.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
    reason?: string;
    score?: number;
  };
  const score = Number(parsed.score ?? 0) / 5;
  return result(score >= 0.9, score, parsed.reason ?? "The judge did not return a reason.");
}
