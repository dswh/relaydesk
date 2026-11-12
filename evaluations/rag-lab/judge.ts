import { generateText, Output } from "ai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { atomicJson, calibrationRows, captures, dataRoot, familySplit, feedback, labRoot, optionalJson, sha, wilson, type TraceRecord, type HumanFeedback } from "./store";

const verdictSchema = z.object({ verdict: z.enum(["pass", "fail"]), critique: z.string().min(8).max(2000) });
export type JudgeVerdict = z.infer<typeof verdictSchema> & { model: string; inputTokens: number; outputTokens: number };
type LabeledTrace = { trace: TraceRecord; label: HumanFeedback };
export function balancedExamples(examples: LabeledTrace[]) {
  const sorted = [...examples].sort((a,b) => a.trace.id.localeCompare(b.trace.id));
  return [...sorted.filter(e => e.label.verdict === "pass").slice(0,4), ...sorted.filter(e => e.label.verdict === "fail").slice(0,4)];
}
const evaluationHash = (rows: LabeledTrace[]) => sha(rows.map(r => ({ input: judgeInput(r.trace), label:r.label })).sort((a,b) => sha(a).localeCompare(sha(b))));
export function judgeInput(trace: TraceRecord) {
  return { question: trace.evalCase.question, followUp: trace.evalCase.followUp,
    expectedBehavior: trace.evalCase.referenceAnswer, expectedOutcome: trace.evalCase.expectedOutcome,
    retrievedEvidence: trace.answer.retrieved.map(c => ({ sourceId: c.sourceId, heading: c.heading, content: c.content })),
    answer: trace.answer.answer, outcome: trace.answer.outcome };
}
export async function judgeAnswer(trace: TraceRecord, examples: Array<{ trace: TraceRecord; label: HumanFeedback }>): Promise<JudgeVerdict> {
  const model = process.env.RELAYDESK_HELP_JUDGE_MODEL?.trim();
  if (!model || !process.env.AI_GATEWAY_API_KEY) throw new Error("Configure the model provider and RELAYDESK_HELP_JUDGE_MODEL before running a live judge.");
  const rubric = await readFile(path.join(labRoot, "judge-prompt.txt"), "utf8");
  const fewshot = balancedExamples(examples).map(e => ({ record: judgeInput(e.trace), verdict: e.label.verdict, critique: e.label.critique }));
  const result = await generateText({ model, maxRetries: 0, maxOutputTokens: 700, temperature: 0,
    output: Output.object({ schema: verdictSchema }), system: rubric,
    prompt: JSON.stringify({ expertExamples: fewshot, recordToJudge: judgeInput(trace) }),
  });
  return { ...result.output, model, inputTokens: result.totalUsage.inputTokens ?? 0, outputTokens: result.totalUsage.outputTokens ?? 0 };
}
export function confusion(rows: Array<{ human: "pass" | "fail"; judge: "pass" | "fail" }>) {
  const failures = rows.filter(r => r.human === "fail"), passes = rows.filter(r => r.human === "pass");
  const detected = failures.filter(r => r.judge === "fail").length, accepted = passes.filter(r => r.judge === "pass").length;
  return {
    failures: failures.length, passes: passes.length, detected, accepted,
    failureDetectionRate: failures.length ? detected / failures.length : null,
    correctAcceptanceRate: passes.length ? accepted / passes.length : null,
    failureDetection95CI: wilson(detected, failures.length), correctAcceptance95CI: wilson(accepted, passes.length),
  };
}
export async function judgeIdentity() {
  const labels = await feedback();
  const rows = calibrationRows(await captures(), labels);
  const examples = balancedExamples(rows.filter(r => familySplit(r.trace.family) === "fewshot"));
  const model = process.env.RELAYDESK_HELP_JUDGE_MODEL || "";
  const rubric = await readFile(path.join(labRoot, "judge-prompt.txt"), "utf8");
  return { rows, examples, model, version: sha({ model, rubric, examples: examples.map(e => ({ input: judgeInput(e.trace), label: e.label })) }) };
}
export async function calibrateJudge(finalize: boolean) {
  const identity = await judgeIdentity();
  const split = finalize ? "test" : "dev";
  const evaluation = identity.rows.filter(r => familySplit(r.trace.family) === split);
  const contract = JSON.parse(await readFile(path.join(labRoot, "contract.json"), "utf8"));
  const counts = { fewshot: identity.examples.length, pass: evaluation.filter(r => r.label.verdict === "pass").length, fail: evaluation.filter(r => r.label.verdict === "fail").length };
  if (!identity.examples.some(r => r.label.verdict === "pass") || !identity.examples.some(r => r.label.verdict === "fail") || counts.pass < contract.judgeMinimumExamplesPerClass || counts.fail < contract.judgeMinimumExamplesPerClass) {
    return { ready: false, split, counts, requiredPerClass: contract.judgeMinimumExamplesPerClass, reason: "Collect more human-labeled live traces. Fixture outputs do not validate a semantic judge. Both Pass and Fail examples are required in every evaluation split." };
  }
  const dir = path.join(dataRoot, "calibration", identity.version);
  const finalFile = path.join(dir, "test.json");
  if (finalize && await optionalJson(finalFile)) throw new Error("This judge version already used its test split. Inspect its existing report. Return to development with a new held-out set for another final estimate.");
  if (finalize) {
    const dev = await optionalJson<{ passed: boolean }>(path.join(dir, "dev.json"));
    if (!dev?.passed) throw new Error("The current judge must pass development calibration before the final test.");
    await atomicJson(finalFile, { status: "started", version: identity.version, at: new Date().toISOString() });
  }
  const results = [];
  for (const row of evaluation) results.push({ traceId: row.trace.id, family: row.trace.family, human: row.label.verdict, ...(await judgeAnswer(row.trace, identity.examples)) });
  const metrics = confusion(results.map(r => ({ human: r.human, judge: r.verdict })));
  const passed = metrics.failureDetectionRate! >= contract.judgeMinimumFailureDetectionRate && metrics.correctAcceptanceRate! >= contract.judgeMinimumCorrectAcceptanceRate;
  const report = { ready: true, passed, split, version: identity.version, evaluationHash:evaluationHash(evaluation), metrics, counts, results, completedAt: new Date().toISOString() };
  await atomicJson(path.join(dir, `${split}.json`), report);
  return report;
}
export async function requireValidatedJudge() {
  const identity = await judgeIdentity();
  const report = await optionalJson<{ passed: boolean; status?: string; evaluationHash?: string }>(path.join(dataRoot, "calibration", identity.version, "test.json"));
  if (!report?.passed) throw new Error("This judge version has no passing held-out human-label calibration. Complete trace review, development calibration, and the final judge test first.");
  if (report.evaluationHash !== evaluationHash(identity.rows.filter(r => familySplit(r.trace.family) === "test"))) throw new Error("The held-out labels changed after calibration. Establish a new untouched judge-validation set before using this report.");
  return identity;
}
