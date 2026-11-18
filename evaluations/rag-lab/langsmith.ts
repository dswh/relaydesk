import { Client, AgentAddress } from "langsmith";
import type { RunTreeConfig } from "langsmith/run_trees";

import { optionalJson, atomicJson, dataRoot, sha, type Capture, type HumanFeedback, type TraceRecord } from "./store";
import path from "node:path";
import { loadLabTasks } from "./tasks";

export function connection(required = true) {
  const apiKey = process.env.LANGSMITH_API_KEY?.trim();
  if (!apiKey) { if (required) throw new Error("Add LANGSMITH_API_KEY to this worktree's .env.local."); return undefined; }
  const agent = process.env.LANGSMITH_AGENT_ID?.trim();
  const project = process.env.LANGSMITH_PROJECT?.trim();
  if (agent && project) throw new Error("Choose agent addressing or LANGSMITH_PROJECT, rather than both.");
  if (!agent && !project) throw new Error("Set LANGSMITH_AGENT_ID or LANGSMITH_PROJECT.");
  const endpoint = process.env.LANGSMITH_ENDPOINT?.trim() || "https://api.smith.langchain.com";
  if (!endpoint.startsWith("https://")) throw new Error("LANGSMITH_ENDPOINT must use HTTPS.");
  const client = new Client({ apiKey, apiUrl: endpoint, workspaceId: process.env.LANGSMITH_WORKSPACE_ID || undefined });
  const destination: Pick<RunTreeConfig, "address" | "project_name"> = agent
    ? { address: new AgentAddress(agent, process.env.LANGSMITH_AGENT_ENVIRONMENT || "local") }
    : { project_name: project };
  return { client, destination, endpoint, agent, project };
}
export function stableId(value: string) {
  const h = sha(value).slice(0, 32).split(""); h[12] = "5"; h[16] = "8";
  const s = h.join("");return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}
export async function tracingProjectId(cloud=connection()!){
  if(cloud.project)return (await cloud.client.readProject({projectName:cloud.project})).id;
  const agent=await cloud.client.agents.retrieve(cloud.agent!,{}, {timeout:10000,maxRetries:0});
  const environment=(process.env.LANGSMITH_AGENT_ENVIRONMENT||"local").toUpperCase();
  const project=agent.environments.find(e=>e.environment===environment)?.tracer_session_id;
  if(!project)throw new Error("This agent has no tracing project for the selected environment.");
  return project;
}
export async function verifyCapture(capture:Capture,cloud=connection()!){
  const project=await tracingProjectId(cloud);
  await cloud.client.awaitPendingTraceBatches();
  for(const trace of capture.traces){
    if(trace.mode!=="live")continue;
    try{
      const run=await cloud.client.runs.retrieve(trace.id,{project_id:project,start_time:trace.startedAt,selects:["ID","START_TIME","END_TIME","OUTPUTS"]},{timeout:10000,maxRetries:0});
      trace.cloudUploaded=run.id===trace.id&&Boolean(run.end_time)&&Boolean(run.outputs);
      if(trace.cloudUploaded&&run.start_time)trace.startedAt=run.start_time;
    }catch{trace.cloudUploaded=false;console.info(`Cloud trace ${trace.id} is not yet verified. Its local record remains available.`)}
  }
  return capture.traces.filter(t=>t.cloudUploaded).length;
}
export async function setupLangSmith(capture: Capture) {
  const { client, destination, project, agent } = connection()!;
  const registryAgent=agent?await client.agents.retrieve(agent):undefined;
  if (project) await client.createProject({ projectName: project, upsert: true, description: "RelayDesk RAG trace review and evaluation." });
  const tasks = await loadLabTasks();
  if (sha(tasks) !== capture.manifest.datasetHash || new Set(capture.traces.map(t => t.caseId)).size !== tasks.length) throw new Error("Use a complete capture of the current development dataset before setting up its cloud version.");
  const datasetName = `relaydesk-rag-dev-${capture.manifest.datasetHash.slice(0,12)}`;
  let dataset;
  try { dataset = await client.readDataset({ datasetName }); }
  catch (error) { if (!isNotFound(error)) throw error; dataset = await client.createDataset(datasetName, { description: "Synthetic public-help development tasks. These are not a final holdout.", metadata: { datasetHash: capture.manifest.datasetHash },tagValueIds:registryAgent?.tag_value_id?[registryAgent.tag_value_id]:undefined }); }
  const unique = [...new Map(capture.traces.map(t => [t.caseId, t])).values()];
  for (const t of unique) {
    const id = stableId(`${dataset.id}:${t.caseId}`);
    try { await client.readExample(id); continue; } catch (error) { if (!isNotFound(error)) throw error; }
    await client.createExample({ id, dataset_id: dataset.id,
      inputs: { messages: messagesFor(t), caseId: t.caseId },
      outputs: { referenceAnswer: t.evalCase.referenceAnswer, expectedOutcome: t.evalCase.expectedOutcome, expectedSources: t.evalCase.expectedSources },
      metadata: { caseId: t.caseId, family: t.family, critical: t.evalCase.critical, synthetic: true, split: "development" },
    });
  }
  let hasHumanConfig=false;
  for await(const config of client.listFeedbackConfigs({feedbackKeys:["human_task_success"],limit:1})){hasHumanConfig=Boolean(config);break;}
  if(!hasHumanConfig)await client.createFeedbackConfig({ feedbackKey: "human_task_success", feedbackConfig: { type: "categorical", categories: [{ value: 1, label: "Pass" }, { value: 0, label: "Fail" }] } });
  const namespace = process.env.LANGSMITH_WORKSPACE_ID || process.env.LANGSMITH_ORGANIZATION_ID;
  if (!namespace) throw new Error("Set the workspace or organization ID to namespace the review queue.");
  const queueId = stableId(`relaydesk-rag-human-review:${namespace}:${process.env.LANGSMITH_AGENT_ID || project}`);
  try { await client.readAnnotationQueue(queueId); }
  catch (error) {
    if (!isNotFound(error)) throw error;
    await client.createAnnotationQueue({ queueId, name: "RelayDesk RAG human review", rubricInstructions: "Read the question, evidence, and answer. Write what is wrong in your own words. Then record Pass or Fail. Do not accept a model score as a human label.", rubricItems: [{ feedback_key: "human_task_success", is_required: true }] });
  }
  const state = { datasetId: dataset.id, datasetName, queueId, destination, createdAt: new Date().toISOString() };
  await atomicJson(path.join(dataRoot, "langsmith.json"), state);
  return state;
}
function isNotFound(error: unknown) {
  const e = error as { status?: number; statusCode?: number; message?: string };
  return e.status === 404 || e.statusCode === 404 || /not found|404/i.test(e.message || "");
}
export function messagesFor(trace: TraceRecord) {
  return [{ role: "user", content: trace.evalCase.question }, ...(trace.evalCase.followUp ? [{ role: "user", content: trace.evalCase.followUp }] : [])];
}
export async function syncFeedback(trace: TraceRecord, label: HumanFeedback) {
  if (!trace.cloudUploaded || trace.mode !== "live") return { synced: false, reason: "Local or fixture trace. No cloud feedback was created." };
  const { client, destination, project } = connection()!;
  const locator = destination.address
    ? { address: destination.address as AgentAddress }
    : { sessionId: (await client.readProject({ projectName: project })).id };
  await client.createFeedback({ ...locator, runId: trace.id, traceId: trace.id, startTime: trace.startedAt,
    key: "human_task_success", score: label.verdict === "pass" ? 1 : 0,
    value: label.verdict === "pass" ? "Pass" : "Fail", comment: label.critique,
    feedbackId: stableId(`feedback:${label.id}`), feedbackSourceType: "app",
    sourceInfo: { reviewer: label.reviewer, failureMode: label.failureMode, annotationRevision: label.id },
  });
  await client.awaitPendingTraceBatches();
  return { synced: true };
}
export async function recordCheckFeedback(trace:TraceRecord, verdict:{verdict:"pass"|"fail";critique:string},judgeVersion:string){
  const {client,destination,project}=connection()!;
  const locator=destination.address?{address:destination.address as AgentAddress}:{sessionId:(await client.readProject({projectName:project})).id};
  for(const metric of [{key:"task_success",pass:verdict.verdict==="pass",reason:verdict.critique},...trace.checks]){
    await client.createFeedback({...locator,runId:trace.id,traceId:trace.id,startTime:trace.startedAt,key:metric.key,score:metric.pass?1:0,comment:metric.reason,feedbackId:stableId(`checker:${trace.id}:${metric.key}:${judgeVersion}`),feedbackSourceType:"model",sourceInfo:{checker:"trusted-rag-loop",judgeVersion,caseId:trace.caseId}});
  }
}
export async function enqueueCapture(capture: Capture) {
  const state = await optionalJson<{ queueId: string }>(path.join(dataRoot, "langsmith.json"));
  if (!state) throw new Error("Run pnpm rag:langsmith:setup first.");
  const cloud=connection()!;
  const project=await tracingProjectId(cloud);
  const runs = capture.traces.filter(t => t.mode === "live" && t.cloudUploaded).map(t => ({runId:t.id,sessionId:project,startTime:t.startedAt}));
  if (runs.length) await cloud.client.addRunsToAnnotationQueue(state.queueId, runs);
  return { queued: runs.length, queueId: state.queueId };
}
