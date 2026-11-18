import { config as loadEnvironment } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { closeDatabase, query } from "../../src/lib/db";
import { getHelpChatConfig } from "../../src/lib/help-chat-config";
import { hasHelpModelKey } from "../../src/lib/ai/help-model-provider";
import { captureAnswers } from "./capture";
import { captures, dataRoot, feedback, labRoot } from "./store";
import { corpusSnapshot } from "./corpus";
import { connection, enqueueCapture, setupLangSmith, syncFeedback } from "./langsmith";
import { calibrateJudge } from "./judge";
import { runExperiment } from "./experiment";
import { startReview } from "./review-server";
import { compareFiles } from "./compare";

loadEnvironment({ path: ".env.local", quiet: true });
const [command = "help", ...args] = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
function option(name: string, fallback: string) { const index = args.lastIndexOf(`--${name}`); return index < 0 ? fallback : args[index + 1] || fallback; }

async function preflight() {
  const config = getHelpChatConfig();
  const result: Record<string, unknown> = { database: false, modelProvider:config.modelProvider, openrouterProviders:config.openrouterProviders, providerKey: hasHelpModelKey(config), generationModel: config.generationModel || "not configured", judgeModel: process.env.RELAYDESK_HELP_JUDGE_MODEL || "not configured", embeddingMode: config.embeddingMode, langsmithKey: Boolean(process.env.LANGSMITH_API_KEY), langsmithDestination: process.env.LANGSMITH_AGENT_ID || process.env.LANGSMITH_PROJECT || "not configured", langsmithEndpoint: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com" };
  try { const indexed = await query("select embedding_model, count(*)::int as chunks from help_knowledge_chunks group by embedding_model"); result.database = true; result.index = indexed.rows; result.indexMatchesQueryModel = indexed.rows.length === 1 && indexed.rows[0].embedding_model === config.embeddingModel; }
  catch { result.databaseError = "Start the dedicated database and run its migrations and index command."; }
  result.indexMatchesApprovedCorpus = false;
  if (result.indexMatchesQueryModel) {
    try {
      const corpus = await corpusSnapshot(config.embeddingModel);
      result.indexMatchesApprovedCorpus = true;
      result.indexedArticles = corpus.documents;
      result.indexedSections = corpus.chunks;
    } catch {
      result.indexError = "The index does not match the approved articles. Check the index before running evaluations.";
    }
  }
  if (flag("remote") && process.env.LANGSMITH_API_KEY) {
    const cloud = connection()!;
    if (cloud.project) await cloud.client.readProject({ projectName: cloud.project });
    else {
      const projectId=process.env.LANGSMITH_TRACING_PROJECT_ID;
      if(!projectId)throw new Error("Set LANGSMITH_TRACING_PROJECT_ID to the agent's existing tracing project ID before a remote preflight.");
      await cloud.client.readProject({projectId});
    }
    result.langsmithAuthenticated = true;
  }
  result.liveReady = result.database && result.providerKey && config.generationModel && process.env.RELAYDESK_HELP_JUDGE_MODEL && config.embeddingMode === "gateway" && result.indexMatchesApprovedCorpus && result.langsmithKey;
  if (!result.liveReady) process.exitCode = 2;
  return result;
}
async function main() {
  if (command === "review") { startReview(); return; }
  let result: unknown;
  try {
    if (command === "preflight") result = await preflight();
    else if (command === "capture") result = await captureAnswers({ fixture: flag("fixture"), local: flag("local"), repeats: Number(option("repeats", "2")), limit: Number(option("limit", "15")), offset:Number(option("offset","0")) });
    else if (command === "cloud-setup") {
      const capture = (await captures())[0];
      if (!capture) throw new Error("Capture a local smoke run or a live run before setting up the dataset.");
      result = await setupLangSmith(capture);
    } else if (command === "enqueue") {
      const capture = (await captures())[0]; if (!capture) throw new Error("Capture answers first."); result = await enqueueCapture(capture);
    } else if (command === "sync-feedback") {
      const labels = await feedback(); let synced = 0;
      for (const trace of (await captures()).flatMap(c => c.traces)) { const label = labels.get(trace.id); if (label && (await syncFeedback(trace, label)).synced) synced++; }
      result = { synced };
    } else if (command === "calibrate") { result = await calibrateJudge(flag("finalize")); if (!(result as { ready: boolean }).ready) process.exitCode = 2; }
    else if (command === "experiment") result = await runExperiment({ hardOnly: flag("hard-only"), repeats: Number(option("repeats", "3")), name: option("name", "candidate") });
    else if (command === "compare") result = await compareFiles(option("baseline", ""), option("candidate", ""), option("target", ""));
    else if (command === "contract") result = JSON.parse(await readFile(path.join(labRoot, "contract.json"), "utf8"));
    else result = { commands: ["pnpm rag:preflight", "pnpm rag:capture --fixture --local", "pnpm rag:review", "pnpm rag:langsmith:setup", "pnpm rag:capture", "pnpm rag:judge:validate", "pnpm rag:judge:validate --finalize", "pnpm rag:experiment --name baseline", "pnpm rag:experiment --name candidate"], dataDirectory: dataRoot };
    console.info(JSON.stringify(result, null, 2));
  } finally { await closeDatabase(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "RAG workflow failed."); process.exitCode = 1; });
