import { createServer, type IncomingMessage } from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { captures, feedback, saveFeedback, labRoot, dataRoot, optionalJson, calibrationRows, familySplit } from "./store";
import { syncFeedback } from "./langsmith";
import type { LoopState } from "./loop";
import { hasHelpModelKey } from "../../src/lib/ai/help-model-provider";

async function body(request: IncomingMessage) {
  let text = "";
  for await (const chunk of request) {
    text += chunk.toString();
    if (Buffer.byteLength(text) > 24_000) throw new Error("The review is too large. Keep the critique under 4,000 characters.");
  }
  return JSON.parse(text) as unknown;
}
export function startReview(port = Number(process.env.RAG_REVIEW_PORT || 4180)) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Choose a valid local review port.");
  const token = randomBytes(24).toString("hex");
  const origin = `http://127.0.0.1:${port}`;
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    const reply = (status: number, value: unknown) => { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(value)); };
    try {
      if (request.headers.host !== `127.0.0.1:${port}` && request.headers.host !== `localhost:${port}`) return reply(403, { error: "Use the local review URL." });
      const url = new URL(request.url || "/", origin);
      if (request.method === "GET" && ["/", "/workshop"].includes(url.pathname)) {
        const html = (await readFile(path.join(labRoot, url.pathname === "/workshop" ? "workshop.html" : "review.html"), "utf8")).replace("__REVIEW_TOKEN__", token);
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); response.end(html); return;
      }
      if(request.method === "GET" && url.pathname === "/api/loop") {
        const state=await optionalJson<LoopState>(path.join(dataRoot,"loop-state.json"));
        const latest=state?.latest&&path.resolve(state.latest).startsWith(dataRoot+path.sep)?await optionalJson(state.latest):null;
        const baseline=state?.baseline&&path.resolve(state.baseline).startsWith(dataRoot+path.sep)?await optionalJson(state.baseline):null;
        const contract=JSON.parse(await readFile(path.join(labRoot,"contract.json"),"utf8"));
        return reply(200,{state,latest,baseline,contract,connections:{provider:hasHelpModelKey(),langsmith:Boolean(process.env.LANGSMITH_API_KEY)}});
      }
      if (request.method === "GET" && url.pathname === "/api/review") {
        const all = await captures(), labels = await feedback();
        const workspace = process.env.LANGSMITH_ORGANIZATION_ID;
        const agent = process.env.LANGSMITH_AGENT_ID;
        return reply(200, { captures: all, labels: Object.fromEntries(labels),
          langsmithUrl: workspace && agent ? `https://smith.langchain.com/o/${encodeURIComponent(workspace)}/a/${encodeURIComponent(agent)}` : null,
          calibrationCounts: { liveLabeled: calibrationRows(all, labels).length, splits: Object.fromEntries(["fewshot", "dev", "test"].map(split => [split, calibrationRows(all, labels).filter(r => familySplit(r.trace.family) === split).length])) },
        });
      }
      if (request.method === "GET" && url.pathname === "/api/export") {
        response.setHeader("Content-Disposition", 'attachment; filename="rag-human-reviews.json"');
        return reply(200, [...(await feedback()).values()]);
      }
      if (request.method === "POST" && url.pathname === "/api/review") {
        if (request.headers["x-review-token"] !== token || ![origin, `http://localhost:${port}`].includes(request.headers.origin || "") || !request.headers["content-type"]?.startsWith("application/json")) return reply(403, { error: "Reload this local page before saving." });
        const label = await saveFeedback(await body(request));
        const trace = (await captures()).flatMap(c => c.traces).find(t => t.id === label.traceId)!;
        let cloud: { synced: boolean; reason?: string } = { synced: false };
        try { cloud = await syncFeedback(trace, label); }
        catch { cloud = { synced: false, reason: "Saved locally. Cloud sync is pending; run pnpm rag:feedback:sync after checking the connection." }; }
        return reply(200, { label, cloud });
      }
      return reply(404, { error: "Not found" });
    } catch (error) {
      return reply(400, { error: error instanceof Error ? error.message : "The review could not be saved." });
    }
  });
  server.listen(port, "127.0.0.1", () => console.info(`RAG review: ${origin}`));
  return server;
}
