import { config as loadEnvironment } from "dotenv";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

import type { generateHelpChatAnswer, HelpChatAnswer } from "../../src/lib/ai/help-chat";
import type { getHelpChatConfig } from "../../src/lib/help-chat-config";
import { captureRagTrace } from "../../src/lib/ai/rag-observability";
import { closeDatabase } from "../../src/lib/db";
import { corpusSnapshot } from "./corpus";
import { loadLabTasks } from "./tasks";
import { atomicJson, hardChecks, labRoot, sha, type TraceRecord } from "./store";
import { judgeAnswer, requireValidatedJudge } from "./judge";
import { connection, recordCheckFeedback } from "./langsmith";
import { makeScorecard, type ScoredCase } from "./scorecard";

loadEnvironment({ path: path.join(labRoot, "../../.env.local"), quiet: true });
const args = process.argv.slice(2);
const option = (key: string) => { const index = args.lastIndexOf(`--${key}`); return index < 0 ? undefined : args[index + 1]; };

async function main() {
  const product = path.resolve(option("product") || ".");
  const outputFile = option("out");
  if (!outputFile) throw new Error("A scorecard output path is required.");
  const fixture = args.includes("--fixture");
  const identity = fixture ? undefined : await requireValidatedJudge();
  if (!fixture && !process.env.AI_GATEWAY_API_KEY) throw new Error("Configure AI_GATEWAY_API_KEY before running the live loop.");
  const productModule = await import(pathToFileURL(path.join(product, "src/lib/ai/help-chat.ts")).href) as { generateHelpChatAnswer: typeof generateHelpChatAnswer };
  const configuration = await import(pathToFileURL(path.join(product, "src/lib/help-chat-config.ts")).href) as { getHelpChatConfig: typeof getHelpChatConfig };
  const config = configuration.getHelpChatConfig();
  if (!fixture && (config.embeddingMode !== "gateway" || !config.generationModel)) throw new Error("Use the configured live generation and embedding models for the improvement loop.");
  if (!fixture && config.generationModel !== process.env.RELAYDESK_HELP_GENERATION_MODEL) throw new Error("The candidate changed the pinned generation model.");
  if (!fixture && config.embeddingModel !== process.env.RELAYDESK_HELP_EMBEDDING_MODEL) throw new Error("The candidate changed the pinned embedding model.");
  const corpus = await corpusSnapshot(config.embeddingModel);
  const tasks = await loadLabTasks();
  if (!tasks.length || tasks.length > 50) throw new Error("Use between 1 and 50 questions per active loop epoch.");
  const cloud = fixture ? undefined : connection();
  const cases: ScoredCase[] = [];
  const manifest = { datasetHash: sha(tasks), corpusHash: corpus.hash, judgeVersion: identity?.version || null, contractHash: sha(JSON.parse(await readFile(path.join(labRoot, "contract.json"), "utf8"))), config };
  for (const task of tasks) {
    const row: ScoredCase = { caseId: task.caseId, question: task.question, critical: task.critical, attempts: [] };
    for (let repeat = 1; repeat <= 3; repeat++) {
      const messages = [{ role: "user" as const, content: task.question }, ...(task.followUp ? [{ role: "user" as const, content: task.followUp }] : [])];
      const trace = await captureRagTrace({ messages, caseId: task.caseId }, () => productModule.generateHelpChatAnswer(messages, { config, live: !fixture }), { client: cloud?.client, destination: cloud?.destination, metadata: { ...manifest, source: "trusted-loop-checker", synthetic: true, caseId: task.caseId } });
      const answer: HelpChatAnswer = trace.output;
      const record: TraceRecord = { ...trace, answer, captureId: "loop", caseId: task.caseId, family: task.family || task.caseId, repeat, synthetic: true, mode: fixture ? "fixture" : "live", evalCase: task, checks: hardChecks(answer, task), manifestHash: sha(manifest), cloudUploaded: false };
      const semantic = identity ? await judgeAnswer(record, identity.examples) : undefined;
      if(cloud&&semantic)await recordCheckFeedback(record,semantic,identity!.version);
      row.attempts.push({ repeat, checks: record.checks, semantic, answer: answer.answer, durationMs: trace.durationMs, evidence: answer.retrieved.map(c => ({ sourceId:c.sourceId, heading:c.heading, content:c.content })), traceId:trace.id });
    }
    cases.push(row);
    console.info(`${task.caseId}: measured ${row.attempts.length} repeats`);
  }
  if (cloud) await cloud.client.awaitPendingTraceBatches();
  if((await corpusSnapshot(config.embeddingModel)).hash!==corpus.hash)throw new Error("The source index changed while measuring. Establish a fresh baseline.");
  await atomicJson(path.resolve(outputFile), { manifest, scorecard: makeScorecard(cases, fixture ? "fixture" : "live"), measuredAt: new Date().toISOString() });
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Measurement failed"); process.exitCode = 1; }).finally(closeDatabase);
