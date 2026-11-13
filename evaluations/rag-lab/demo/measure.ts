import { config as loadEnvironment } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { closeDatabase } from "../../../src/lib/db";
import { publicKnowledgeArticles } from "../../../src/lib/knowledge";
import { captureRagTrace } from "../../../src/lib/ai/rag-observability";
import { corpusSnapshot } from "../corpus";
import { connection } from "../langsmith";
import { atomicJson, labRoot, sha } from "../store";
import { demoContract, questionsSchema, type RetrievalReport, type RetrievalAttempt } from "./contract";
import type * as Chat from "../../../src/lib/ai/help-chat";
import type * as Repository from "../../../src/lib/knowledge-repository";
import type * as Configuration from "../../../src/lib/help-chat-config";
loadEnvironment({ path: path.join(labRoot, "../../.env.local"), quiet: true });
const args = process.argv.slice(2);
const arg = (n: string) => { const i = args.indexOf(`--${n}`); if (i < 0 || !args[i + 1])
    throw new Error(`Missing --${n}.`); return args[i + 1]!; };
async function main() {
    const root = path.resolve(arg("product"));
    const tasks = questionsSchema.parse(JSON.parse(await readFile(arg("dataset"), "utf8")));
    const chat = await import(pathToFileURL(path.join(root, "src/lib/ai/help-chat.ts")).href) as typeof Chat;
    const repo = await import(pathToFileURL(path.join(root, "src/lib/knowledge-repository.ts")).href) as typeof Repository;
    const configModule = await import(pathToFileURL(path.join(root, "src/lib/help-chat-config.ts")).href) as typeof Configuration;
    const config = configModule.getHelpChatConfig();
    if (config.embeddingMode !== "gateway" || !process.env.RELAYDESK_MODEL_BUDGET_FILE || !Number(process.env.RELAYDESK_MODEL_BUDGET_USD))
        throw new Error("The demo requires live embeddings and the persistent model spending guard.");
    if (process.env.RELAYDESK_HELP_INCLUDE_CONTEXT !== undefined)
        throw new Error("Unset RELAYDESK_HELP_INCLUDE_CONTEXT for this demo. The candidate code must determine conversation handling.");
    const corpus = await corpusSnapshot(config.embeddingModel);
    const modelsHash = sha({ embedding: config.embeddingModel, generation: config.generationModel, provider: config.modelProvider, routing: config.openrouterProviders });
    const cloud = args.includes("--cloud") ? connection(false) : undefined;
    const productHash = sha(await Promise.all(["src/lib/ai/help-chat.ts", "src/lib/help-chat-config.ts", "src/lib/knowledge-repository.ts"].map(async (f) => [f, sha(await readFile(path.join(root, f)))])));
    const report: RetrievalReport = { schemaVersion: 1, measuredAt: new Date().toISOString(), manifest: { datasetHash: sha(tasks), corpusHash: corpus.hash, contractHash: sha(demoContract), modelsHash, productHash, split: arg("split"), repeats: 3 }, cases: [] };
    for (const task of tasks) {
        const row = { ...task, attempts: [] as RetrievalAttempt[] };
        const messages = [{ role: "user" as const, content: task.question }, ...(task.followUp ? [{ role: "user" as const, content: task.followUp }] : [])];
        for (let repeat = 1; repeat <= 3; repeat++) {
            const query = chat.buildHelpRetrievalQuery(messages, config);
            const trace = await captureRagTrace({ messages, query }, () => repo.retrieveHelpKnowledge(query, config), { name: "relaydesk.rag.retrieval-check", client: cloud?.client, destination: cloud?.destination, metadata: { source: "retrieval-workshop", split: report.manifest.split, synthetic: true, caseId: task.id, repeat } });
            const ids = trace.output.map(c => c.sourceId), index = ids.indexOf(task.expectedSource);
            const attempt: RetrievalAttempt = { repeat, query, rank: index < 0 ? null : index + 1, approved: ids.length > 0 && ids.every(id => publicKnowledgeArticles.some(a => a.id === id)), sourceIds: ids, traceId: trace.id };
            if (repeat === 1 && args.includes("--answers")) {
                const answer = await captureRagTrace({ messages }, () => chat.generateHelpChatAnswer(messages, { config, live: true }), { client: cloud?.client, destination: cloud?.destination, metadata: { source: "retrieval-workshop-answer", split: report.manifest.split, synthetic: true, caseId: task.id, answerQuality: "unscored" } });
                attempt.answer = { text: answer.output.answer, outcome: answer.output.outcome, citationIds: answer.output.citations.map(c => c.sourceId), traceId: answer.id, quality: "unscored" };
            }
            row.attempts.push(attempt);
        }
        report.cases.push(row);
        await atomicJson(path.resolve(arg("out")), report);
        console.info(`${task.id}: ranks ${row.attempts.map(a => a.rank ?? "missing").join(", ")}`);
    }
    if ((await corpusSnapshot(config.embeddingModel)).hash !== corpus.hash)
        throw new Error("The corpus changed while measuring.");
    if (cloud)
        await cloud.client.awaitPendingTraceBatches();
    await atomicJson(path.resolve(arg("out")), report);
}
main().catch(e => { console.error(e instanceof Error ? e.message : "Retrieval measurement failed."); process.exitCode = 1; }).finally(closeDatabase);

