import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { HelpChatAnswer } from "../../src/lib/ai/help-chat";
import type { RagSpan } from "../../src/lib/ai/rag-observability";
import type { HelpChatEvalCase } from "../help-chat/dataset";
import { publicKnowledgeArticles } from "../../src/lib/knowledge";

export const labRoot = path.resolve(import.meta.dirname);
export const dataRoot = path.join(labRoot, "data");
export const sha = (value: unknown) => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
export const feedbackSchema = z.object({
  traceId: z.uuid(), verdict: z.enum(["pass", "fail"]),
  critique: z.string().trim().min(8).max(4000),
  failureMode: z.string().trim().max(160).default(""),
  reviewer: z.string().trim().min(2).max(100),
});
export type HumanFeedback = z.infer<typeof feedbackSchema> & { id: string; updatedAt: string; traceHash: string };
export type Check = { key: string; pass: boolean; reason: string };
export type TraceRecord = {
  id: string; captureId: string; caseId: string; family: string; repeat: number;
  synthetic: true; mode: "live" | "fixture"; evalCase: HelpChatEvalCase;
  answer: HelpChatAnswer; spans: RagSpan[]; checks: Check[];
  startedAt: string; endedAt: string; durationMs: number;
  manifestHash: string; cloudUploaded: boolean;
};
export type Manifest = {
  schemaVersion: 1; id: string; createdAt: string; mode: "live" | "fixture";
  pipeline: { commit: string; patchHash: string };
  config: Record<string, unknown>; corpusHash: string; datasetHash: string;
  judgeHash: string; contractHash: string;
};
export type Capture = { manifest: Manifest; traces: TraceRecord[] };

export async function atomicJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, file);
}
export async function optionalJson<T>(file: string): Promise<T | undefined> {
  try { return JSON.parse(await readFile(file, "utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}
export async function captures(): Promise<Capture[]> {
  const directory = path.join(dataRoot, "captures");
  let names: string[];
  try { names = await readdir(directory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  return Promise.all(names.filter(n => n.endsWith(".json")).sort().reverse().map(async name => JSON.parse(await readFile(path.join(directory, name), "utf8")) as Capture));
}
export async function feedback(): Promise<Map<string, HumanFeedback>> {
  let content: string;
  try { content = await readFile(path.join(dataRoot, "annotations.jsonl"), "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map(); throw error; }
  const result = new Map<string, HumanFeedback>();
  for (const line of content.split("\n").filter(Boolean)) {
    const row = JSON.parse(line) as HumanFeedback;
    result.set(row.traceId, row);
  }
  return result;
}
export async function saveFeedback(input: unknown): Promise<HumanFeedback> {
  const parsed = feedbackSchema.parse(input);
  const trace = (await captures()).flatMap(c => c.traces).find(t => t.id === parsed.traceId);
  if (!trace) throw new Error("This trace no longer exists. Reload the review queue.");
  const row: HumanFeedback = { ...parsed, id: randomUUID(), updatedAt: new Date().toISOString(), traceHash: sha(trace.answer) };
  await mkdir(dataRoot, { recursive: true });
  await appendFile(path.join(dataRoot, "annotations.jsonl"), JSON.stringify(row) + "\n", { mode: 0o600 });
  return row;
}
export function pipelineVersion() {
  return {
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    patchHash: sha(execFileSync("git", ["diff", "HEAD", "--", "src"], { encoding: "utf8" })),
  };
}
export function hardChecks(answer: HelpChatAnswer, task: HelpChatEvalCase): Check[] {
  const allowed = new Set(answer.retrieved.map(c => c.sourceId));
  const approved = new Set(publicKnowledgeArticles.map(a=>a.id));
  const markers = [...answer.answer.matchAll(/\[([a-z0-9_]+)\]/gi)].map(m => m[1]!);
  return [
    { key: "approved_sources", pass: answer.retrieved.every(c=>approved.has(c.sourceId)), reason: "Retrieved source IDs must belong to the approved public corpus." },
    { key: "response_schema", pass: answer.answer.trim().length > 0 && ["answered", "clarify", "not_found"].includes(answer.outcome), reason: "A non-empty answer and a valid response route are required." },
    { key: "citation_membership", pass: markers.every(id => allowed.has(id)), reason: "Every raw source marker must belong to the retrieved public evidence. This does not prove entailment." },
    { key: "citation_present", pass: answer.outcome !== "answered" || markers.length > 0, reason: "An answered request must cite its retrieved evidence." },
    { key: "critical_route", pass: !task.critical || answer.outcome === task.expectedOutcome, reason: `The protected case requires the ${task.expectedOutcome} route.` },
  ];
}
export const traceHash = (trace: TraceRecord) => sha(trace.answer);
export function calibrationRows(all: Capture[], labels: Map<string, HumanFeedback>) {
  const labeled = all.flatMap(c => c.traces).filter(t => t.mode === "live" && labels.get(t.id)?.traceHash === traceHash(t));
  const unique = new Map<string, TraceRecord>();
  for (const trace of labeled) {
    const key = sha({ family: trace.family, input: trace.evalCase.question, followUp: trace.evalCase.followUp, evidence: trace.answer.retrieved, answer: trace.answer.answer });
    if (!unique.has(key)) unique.set(key, trace);
  }
  return [...unique.values()].map(trace => ({ trace, label: labels.get(trace.id)! }));
}
export function familySplit(family: string): "fewshot" | "dev" | "test" {
  const bucket = parseInt(sha(`relaydesk-judge-split-v1:${family}`).slice(0, 8), 16) % 10;
  return bucket < 2 ? "fewshot" : bucket < 6 ? "dev" : "test";
}
export function wilson(successes: number, total: number) {
  if (!total) return null;
  const z = 1.96, p = successes / total, denominator = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / denominator;
  const half = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
