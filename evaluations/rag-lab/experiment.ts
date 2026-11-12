import { evaluate, type EvaluatorT } from "langsmith/evaluation";
import path from "node:path";
import { readFile } from "node:fs/promises";

import { generateHelpChatAnswer, type HelpChatMessage } from "../../src/lib/ai/help-chat";
import { captureRagTrace } from "../../src/lib/ai/rag-observability";
import { getHelpChatConfig } from "../../src/lib/help-chat-config";
import { corpusSnapshot } from "./corpus";
import { loadLabTasks } from "./tasks";
import { connection } from "./langsmith";
import { judgeAnswer, requireValidatedJudge } from "./judge";
import { atomicJson, dataRoot, hardChecks, labRoot, optionalJson, pipelineVersion, sha, type TraceRecord } from "./store";

export async function runExperiment(options: { hardOnly: boolean; repeats: number; name: string }) {
  if (!Number.isInteger(options.repeats) || options.repeats < 1 || options.repeats > 3) throw new Error("Choose between 1 and 3 repetitions.");
  const config = getHelpChatConfig();
  if (!process.env.AI_GATEWAY_API_KEY || !config.generationModel || config.embeddingMode !== "gateway") throw new Error("A live experiment needs a configured model provider and a matching live embedding index. Run pnpm rag:preflight first.");
  const identity = options.hardOnly ? undefined : await requireValidatedJudge();
  const state = await optionalJson<{ datasetId: string; datasetName: string }>(path.join(dataRoot, "langsmith.json"));
  if (!state) throw new Error("Set up the LangSmith development dataset first.");
  const { client } = connection()!;
  const tasks = await loadLabTasks();
  const data = [];
  for await (const example of client.listExamples({ datasetId: state.datasetId })) {
    const task = tasks.find(t => t.caseId === example.inputs.caseId);
    if (!task || example.inputs.messages?.[0]?.content !== task.question || example.outputs?.referenceAnswer !== task.referenceAnswer) throw new Error("The cloud dataset differs from the frozen local development contract. Create a new version before running.");
    data.push(example);
  }
  if (data.length !== tasks.length) throw new Error("The LangSmith dataset is missing development cases.");
  const corpus=await corpusSnapshot(config.embeddingModel);
  const manifest = { pipeline: pipelineVersion(), config, corpusHash: corpus.hash, datasetHash: sha(tasks), contractHash: sha(JSON.parse(await readFile(path.join(labRoot, "contract.json"), "utf8"))), judgeVersion: identity?.version || null };
  const checks: EvaluatorT = ({ outputs }: { outputs: Record<string, unknown> }) => (outputs.checks as TraceRecord["checks"]).map(c => ({ key: c.key, score: c.pass ? 1 : 0, comment: c.reason }));
  const semantic: EvaluatorT = async ({ outputs }: { outputs: Record<string, unknown> }) => {
    const verdict = await judgeAnswer(outputs.trace as TraceRecord, identity!.examples);
    return { key: "task_success", score: verdict.verdict === "pass" ? 1 : 0, comment: verdict.critique, evaluatorInfo: { version: identity!.version } };
  };
  const results = await evaluate(async (inputs: Record<string, unknown>) => {
    const task = tasks.find(t => t.caseId === inputs.caseId)!;
    const traced = await captureRagTrace({ messages: inputs.messages, caseId: task.caseId }, () => generateHelpChatAnswer(inputs.messages as HelpChatMessage[], { config, live: true }), { client, metadata: { ...manifest, caseId: task.caseId, synthetic: true } });
    const { output, ...timing } = traced;
    const trace: TraceRecord = { ...timing, answer: output, captureId: "experiment", caseId: task.caseId, family: task.family || task.caseId, repeat: 1, synthetic: true, mode: "live", evalCase: task, checks: hardChecks(output, task), manifestHash: sha(manifest), cloudUploaded: false };
    return { answer: output.answer, evidence: output.retrieved, checks: trace.checks, trace };
  }, { client, data, experimentPrefix: `relaydesk-rag-${options.hardOnly ? "hard-checks" : "task-success"}-${options.name}`,
    metadata: { ...manifest, semanticAcceptanceEnabled: !options.hardOnly }, maxConcurrency: 1,
    numRepetitions: options.repeats, evaluators: options.hardOnly ? [checks] : [checks, semantic],
  });
  const rows = [];
  for await (const row of results) rows.push({ runId: row.run.id, caseId: row.example.inputs.caseId, critical: tasks.find(t => t.caseId === row.example.inputs.caseId)!.critical, error: row.run.error, metrics: row.evaluationResults.results });
  await client.awaitPendingTraceBatches();
  const report = { name: results.experimentName, manifest, hardOnly: options.hardOnly, repeats: options.repeats, completedAt: new Date().toISOString(), rows };
  const file = path.join(dataRoot, "experiments", `${sha(results.experimentName).slice(0,20)}.json`);
  await atomicJson(file, report);
  return { file, name: report.name, examples: rows.length, semanticAcceptanceEnabled: !options.hardOnly };
}
