import { randomUUID } from "node:crypto";
import path from "node:path";
import { readFile } from "node:fs/promises";

import { generateHelpChatAnswer } from "../../src/lib/ai/help-chat";
import { captureRagTrace } from "../../src/lib/ai/rag-observability";
import { getHelpChatConfig, HELP_FIXTURE_EMBEDDING_MODEL } from "../../src/lib/help-chat-config";
import { requireHelpModelKey } from "../../src/lib/ai/help-model-provider";
import { corpusSnapshot } from "./corpus";
import { loadLabTasks } from "./tasks";
import { connection, enqueueCapture, verifyCapture } from "./langsmith";
import { atomicJson, dataRoot, hardChecks, labRoot, pipelineVersion, sha, type Capture, type Manifest } from "./store";

export async function captureAnswers(options: { fixture: boolean; repeats: number; limit: number; local: boolean; offset?:number }) {
  const config = getHelpChatConfig();
  if(options.fixture){config.embeddingMode="fixture";config.embeddingModel=HELP_FIXTURE_EMBEDDING_MODEL;}
  const contract = JSON.parse(await readFile(path.join(labRoot, "contract.json"), "utf8"));
  if (!Number.isInteger(options.repeats) || options.repeats < 1 || options.repeats > contract.maxCaptureRepeats) throw new Error("Repeats must be between 1 and 3.");
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > contract.maxCaptureCases) throw new Error("Case limit must be between 1 and 50.");
  if (!options.fixture) {
    requireHelpModelKey(config);
    if (!config.generationModel.trim()) throw new Error("Set RELAYDESK_HELP_GENERATION_MODEL to a model from the configured provider catalog.");
    if (config.embeddingMode !== "gateway") throw new Error("Live RAG capture requires live embeddings. Switch embedding mode to gateway and reindex the dedicated database first.");
  }
  const corpus = await corpusSnapshot(config.embeddingModel);
  const dataset = await loadLabTasks();
  const offset=options.offset??0;
  if(!Number.isInteger(offset)||offset<0||offset>=dataset.length)throw new Error("Choose an offset inside the dataset.");
  const id = new Date().toISOString().replaceAll(":", "-") + "-" + randomUUID().slice(0, 8);
  const manifest: Manifest = {
    schemaVersion: 1, id, createdAt: new Date().toISOString(), mode: options.fixture ? "fixture" : "live",
    pipeline: pipelineVersion(), config: { ...config }, corpusHash: corpus.hash,
    datasetHash: sha(dataset), judgeHash: sha(await readFile(path.join(labRoot, "judge-prompt.txt"), "utf8")),
    contractHash: sha(contract),
  };
  const cloud = options.fixture || options.local ? undefined : connection(false);
  const capture: Capture = { manifest, traces: [] };
  const file = path.join(dataRoot, "captures", `${id}.json`);
  for (const task of dataset.slice(offset, offset+options.limit)) {
    for (let repeat = 1; repeat <= options.repeats; repeat++) {
      const messages = [{ content: task.question, role: "user" as const }, ...(task.followUp ? [{ content: task.followUp, role: "user" as const }] : [])];
      const trace = await captureRagTrace({ messages, caseId: task.caseId }, () => generateHelpChatAnswer(messages, { config, live: !options.fixture }), {
        client: cloud?.client, destination: cloud?.destination,
        metadata: { captureId: id, caseId: task.caseId, synthetic: true, mode: manifest.mode, manifestHash: sha(manifest) },
      });
      const { output, ...timing } = trace;
      capture.traces.push({ ...timing, captureId: id, caseId: task.caseId,
        family: task.family || task.caseId, repeat, synthetic: true, mode: manifest.mode, evalCase: task,
        answer: output, checks: hardChecks(output, task), manifestHash: sha(manifest), cloudUploaded: false,
      });
      await atomicJson(file, capture);
      console.info(`${task.caseId} repeat ${repeat}: ${trace.output.mode}, ${trace.durationMs} ms`);
    }
  }
  if (cloud) {
    await verifyCapture(capture,cloud);
    await atomicJson(file, capture);
    try { await enqueueCapture(capture); }
    catch (error) { console.info(`Traces captured. Queue setup remains: ${error instanceof Error ? error.message : "unavailable"}`); }
  }
  return { file, captureId: id, traces: capture.traces.length, mode: manifest.mode, independentTasks: new Set(capture.traces.map(t => t.family)).size, verifiedCloudTraces: capture.traces.filter(t => t.cloudUploaded).length };
}
