import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";

import type { HelpChatOutcome } from "../../src/lib/ai/help-chat";

export type HelpChatEvalCase = {
  category: string;
  caseId: string;
  critical: boolean;
  description: string;
  expectedOutcome: HelpChatOutcome;
  expectedSources: string[];
  followUp?: string;
  forbiddenClaims: string[];
  question: string;
  referenceAnswer: string;
  requiredFacts: string[][];
  segment: "regression" | "visible";
};

type DatasetRow = {
  description?: unknown;
  vars?: Record<string, unknown>;
};

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function factArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => (Array.isArray(item) ? item.map(String) : [String(item)]))
    : [];
}

export async function loadHelpChatDataset(): Promise<HelpChatEvalCase[]> {
  const file = path.join(process.cwd(), "evaluations", "help-chat", "dataset.yaml");
  const parsed = parse(await readFile(file, "utf8")) as DatasetRow[];
  if (!Array.isArray(parsed)) throw new Error("Help-chat dataset must be an array.");

  const cases = parsed.map((row) => {
    const vars = row.vars ?? {};
    const expectedOutcome = String(vars.expectedOutcome) as HelpChatOutcome;
    if (!vars.caseId || !vars.question || !vars.referenceAnswer) {
      throw new Error("Every help-chat case needs an ID, question, and reference answer.");
    }
    if (!["answered", "clarify", "not_found"].includes(expectedOutcome)) {
      throw new Error(`Invalid expected outcome for ${String(vars.caseId)}.`);
    }

    return {
      category: String(vars.category ?? "Uncategorized"),
      caseId: String(vars.caseId),
      critical: Boolean(vars.critical),
      description: String(row.description ?? vars.caseId),
      expectedOutcome,
      expectedSources: stringArray(vars.expectedSources),
      followUp: vars.followUp ? String(vars.followUp) : undefined,
      forbiddenClaims: stringArray(vars.forbiddenClaims),
      question: String(vars.question),
      referenceAnswer: String(vars.referenceAnswer),
      requiredFacts: factArray(vars.requiredFacts),
      segment: vars.segment === "regression" ? "regression" : "visible",
    } satisfies HelpChatEvalCase;
  });

  const ids = new Set(cases.map((item) => item.caseId));
  if (ids.size !== cases.length) throw new Error("Help-chat case IDs must be unique.");
  return cases;
}
