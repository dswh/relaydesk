import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, open, readFile, readdir, symlink, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { atomicJson, dataRoot, labRoot, optionalJson, sha } from "./store";
import { candidateDecision, selectFailure, type Scorecard } from "./scorecard";
import { judgeIdentity, requireValidatedJudge } from "./judge";
import { loadLabTasks } from "./tasks";

export const productRoot = path.resolve(labRoot, "../..");
const stateFile = path.join(dataRoot, "loop-state.json");
let interrupted=false;
async function withLoopLock<T>(operation: () => Promise<T>) {
  await mkdir(dataRoot,{recursive:true});
  const file=path.join(dataRoot,"loop.lock");
  for(let attempt=0;attempt<2;attempt++){
    let handle;
    try{handle=await open(file,"wx",0o600)}catch(error){
      if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;
      const owner=await optionalJson<{pid:number}>(file);
      if(!owner?.pid)throw new Error("Another loop is starting. Wait before retrying.");
      try{process.kill(owner.pid,0);throw new Error(`Loop process ${owner.pid} already owns the controller. Use that process or stop it first.`)}catch(probe){
        if((probe as NodeJS.ErrnoException).code!=="ESRCH")throw probe;
        await unlink(file);continue;
      }
    }
    try{await handle.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()}));return await operation()}
    finally{await handle.close();await unlink(file)}
  }
  throw new Error("The controller lock changed. Retry after checking the active process.");
}
const writable = ["src/lib/ai/help-chat.ts", "src/lib/help-chat-config.ts", "src/lib/knowledge-repository.ts"];
const allowed = (file: string) => writable.includes(file) || /^tests\/rag-repairs\/[a-zA-Z0-9_-]+\.test\.ts$/.test(file);
type Measured = { manifest: { datasetHash: string; corpusHash: string; judgeVersion: string | null; contractHash: string; config: Record<string, unknown> }; scorecard: Scorecard; measuredAt: string };
export type LoopState = {
  phase: "idle" | "measuring" | "repairing" | "checking" | "awaiting_review" | "goal_reached" | "needs_input" | "bounded_stop";
  updatedAt: string; signature?: string; reason?: string; runDirectory?: string;
  baseline?: string; latest?: string; attempts?: number; target?: string;
  pending?: { candidateRoot: string; candidateTreeHash: string; branch: string; changedFiles: string[]; sourceHash: string; baselineFiles: Record<string,string>; scorecard: string; summary: string };
};
const git = (root: string, args: string[]) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
async function save(state: Omit<LoopState,"updatedAt">) { const value = { ...state, updatedAt: new Date().toISOString() }; await atomicJson(stateFile, value); return value; }
async function fileHash(file: string) { try { return sha(await readFile(file)); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing"; throw error; } }
async function tree(root: string) {
  const names = git(root, ["ls-files", "-c", "-o", "--exclude-standard"]).split("\n").filter(Boolean);
  return Object.fromEntries(await Promise.all([...new Set(names)].sort().map(async name => [name, await fileHash(path.join(root,name))])));
}
async function sourceHash() {
  const names = ["src/lib/ai/help-chat.ts", "src/lib/ai/help-embeddings.ts", "src/lib/ai/help-model-provider.ts", "src/lib/ai/help-model-budget.ts", "src/lib/ai/rag-observability.ts", "src/lib/help-chat-config.ts", "src/lib/knowledge-repository.ts", "src/lib/knowledge.ts"];
  return sha(await Promise.all(names.map(async name => [name, await fileHash(path.join(productRoot,name))])));
}
async function signature() {
  const identity=await judgeIdentity();
  return sha({ source: await sourceHash(), tasks: await loadLabTasks(), skill:await fileHash(path.join(productRoot,".agents/skills/repair-rag/SKILL.md")), contract:await fileHash(path.join(labRoot,"contract.json")), feedback: await readFile(path.join(labRoot,"feedback.md"),"utf8"), judgePrompt: await readFile(path.join(labRoot,"judge-prompt.txt"),"utf8"), calibration:await fileHash(path.join(dataRoot,"calibration",identity.version,"test.json")), credentialsPresent:[Boolean(process.env.AI_GATEWAY_API_KEY),Boolean(process.env.OPENROUTER_API_KEY),Boolean(process.env.LANGSMITH_API_KEY)], modelProvider:process.env.RELAYDESK_HELP_MODEL_PROVIDER, routing:process.env.RELAYDESK_OPENROUTER_PROVIDERS, models: [process.env.RELAYDESK_HELP_GENERATION_MODEL,process.env.RELAYDESK_HELP_JUDGE_MODEL,process.env.RELAYDESK_HELP_EMBEDDING_MODEL] });
}
async function trustedFingerprint() {
  const names = (await readdir(labRoot)).filter(n => /\.(ts|json|txt|md)$/.test(n));
  return sha({ files: await Promise.all(names.sort().map(async name => [name, await fileHash(path.join(labRoot,name))])), tasks: await loadLabTasks() });
}
export async function runProcess(executable: string, args: string[], options: { cwd: string; outputFile: string; timeoutMs: number; input?: string; actor?: boolean }) {
  if(interrupted)throw new Error("The engineer stopped this controller process.");
  await mkdir(path.dirname(options.outputFile), { recursive: true });
  const env = { ...process.env };
  if (options.actor) for (const key of Object.keys(env)) if (/API_KEY|DATABASE_URL|LANGSMITH|GATEWAY|TOKEN|SECRET|PASSWORD/.test(key)) delete env[key];
  return new Promise<void>((resolve,reject) => {
    const child = spawn(executable,args,{cwd:options.cwd,env,stdio:["pipe","pipe","pipe"],detached:process.platform!=="win32"});
    let log = "", done = false;
    const terminate = () => {
      if (done) return;
      if (child.pid && process.platform!=="win32") { try { process.kill(-child.pid,"SIGTERM"); } catch {} } else child.kill("SIGTERM");
      setTimeout(()=>{if(!done){if(child.pid&&process.platform!=="win32"){try{process.kill(-child.pid,"SIGKILL")}catch{}}else child.kill("SIGKILL")}},3000).unref();
    };
    const stop = () => {interrupted=true;process.exitCode=130;terminate()};
    process.once("SIGINT",stop);process.once("SIGTERM",stop);
    const cleanup=()=>{done=true;clearTimeout(timer);process.removeListener("SIGINT",stop);process.removeListener("SIGTERM",stop)};
    const timer = setTimeout(terminate, Math.max(1,options.timeoutMs));
    const append = (chunk: Buffer) => { log += chunk.toString(); if (log.length > 2_000_000) log = log.slice(-2_000_000); };
    child.stdout.on("data",append);child.stderr.on("data",append);
    child.on("error",error=>{cleanup();reject(error)});
    child.on("close",async code=>{cleanup();try{await writeFile(options.outputFile,log,{mode:0o600});if(code===0)resolve();else reject(new Error(`${path.basename(executable)} stopped${interrupted?" by the engineer":` with code ${code}`}. See ${options.outputFile}.`))}catch(error){reject(error)}});
    child.stdin.end(options.input || "");
  });
}
async function measure(root: string, file: string, remainingMs: number, fixture = false) {
  const tsx = path.join(productRoot,"node_modules/tsx/dist/cli.mjs");
  await runProcess(process.execPath,[tsx,"--tsconfig",path.join(root,"tsconfig.json"),path.join(labRoot,"measure.ts"),"--product",root,"--out",file,...(fixture?["--fixture"]:[])],{cwd:productRoot,outputFile:file+".log",timeoutMs:remainingMs});
  return (await optionalJson<Measured>(file))!;
}
async function prepareCandidate(directory: string) {
  const branch = `codex/rag-candidate-${Date.now()}-${randomUUID().slice(0,6)}`;
  git(productRoot,["worktree","add",directory,"-b",branch,"HEAD"]);
  const patch = execFileSync("git",["-C",productRoot,"diff","--binary","HEAD","--","src"],{encoding:"utf8"});
  if(patch)execFileSync("git",["-C",directory,"apply","-"],{input:patch});
  const untracked = git(productRoot,["ls-files","--others","--exclude-standard","--","src"]).split("\n").filter(Boolean);
  for(const file of [...untracked,"package.json","pnpm-lock.yaml"]){await mkdir(path.dirname(path.join(directory,file)),{recursive:true});await copyFile(path.join(productRoot,file),path.join(directory,file));}
  await symlink(path.join(productRoot,"node_modules"),path.join(directory,"node_modules"),"dir");
  return {branch,files:await tree(directory)};
}
function changedFiles(before: Record<string,string>,after:Record<string,string>) {return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(f=>before[f]!==after[f]);}
function sameEpoch(a:Measured,b:Measured){return ["datasetHash","corpusHash","judgeVersion","contractHash"].every(k=>a.manifest[k as keyof Measured["manifest"]]===b.manifest[k as keyof Measured["manifest"]]);}

export const runLoop = (options:{fixture?:boolean;force?:boolean}={}) => withLoopLock(()=>runLoopLocked(options));
async function runLoopLocked(options:{fixture?:boolean;force?:boolean}) {
  const previous=await optionalJson<LoopState>(stateFile);
  if(previous?.phase==="awaiting_review")return previous;
  const epochSignature=await signature();
  if(!options.force&&previous?.signature===epochSignature&&["goal_reached","needs_input","bounded_stop"].includes(previous.phase))return previous;
  const contract=JSON.parse(await readFile(path.join(labRoot,"contract.json"),"utf8"));
  const runDirectory=path.join(dataRoot,"loops",new Date().toISOString().replaceAll(":","-"));
  const started=Date.now(),deadline=started+contract.maxMinutes*60_000;
  const remaining=()=>Math.max(1,deadline-Date.now());
  let state:LoopState=await save({phase:"measuring",signature:epochSignature,runDirectory,attempts:0});
  try{
    if(!options.fixture)await requireValidatedJudge();
    const baselineFile=path.join(runDirectory,"baseline.json");
    const baseline=await measure(productRoot,baselineFile,remaining(),options.fixture);
    state=await save({...state,baseline:baselineFile,latest:baselineFile});
    if(options.fixture)return await save({...state,phase:"needs_input",reason:"The smoke run measured code behavior. Live answers and a validated semantic judge are required before the repair agent may run."});
    if(baseline.scorecard.goalReached)return await save({...state,phase:"goal_reached",reason:"Every question passed all repeated checks. Waiting for new questions or a system change."});
    const failure=selectFailure(baseline.scorecard);
    if(!failure||failure.verdict==="unscored")throw new Error("A scored failure is required before selecting an intervention.");
    const protectedHash=await trustedFingerprint();
    const originalSourceHash=await sourceHash();
    const skill=await readFile(path.join(productRoot,".agents/skills/repair-rag/SKILL.md"),"utf8");
    const feedback=await readFile(path.join(labRoot,"feedback.md"),"utf8");
    const rejected:Array<{attempt:number;reason:unknown}>=[];
    const reject=async(attempt:number,reason:unknown)=>{rejected.push({attempt,reason});await atomicJson(path.join(runDirectory,"rejections.json"),rejected)};
    for(let attempt=1;attempt<=contract.maxCandidates&&Date.now()<deadline;attempt++){
      const candidateRoot=path.join(productRoot,".worktrees",`rag-${Date.now()}-${attempt}`);
      await mkdir(path.dirname(candidateRoot),{recursive:true});
      const candidate=await prepareCandidate(candidateRoot);
      const foundationRoot=path.join(runDirectory,`foundation-${attempt}`);
      for(const file of writable){await mkdir(path.dirname(path.join(foundationRoot,file)),{recursive:true});await copyFile(path.join(candidateRoot,file),path.join(foundationRoot,file));}
      state=await save({...state,phase:"repairing",attempts:attempt,target:failure.caseId});
      const prompt=`${skill}\n\nDesired state: every development question passes, with zero critical failures.\nCurrent score: ${baseline.scorecard.passedQuestions}/${baseline.scorecard.totalQuestions}.\nTarget failure:\n${JSON.stringify(failure,null,2)}\n\nReviewed steering:\n${feedback}\n\nRejected hypotheses so far:\n${JSON.stringify(rejected)}\n\nMake one small shared correction in this candidate worktree. The external checker will evaluate the full frozen question set. Do not change grading artifacts. Leave the patch uncommitted.`;
      const outputFile=path.join(runDirectory,`actor-${attempt}.jsonl`);
      await runProcess("codex",["exec","--json","--ephemeral","--sandbox","workspace-write","-C",candidateRoot,"-"],{cwd:candidateRoot,outputFile,timeoutMs:remaining(),input:prompt,actor:true});
      if(await trustedFingerprint()!==protectedHash||await sourceHash()!==originalSourceHash)throw new Error("The trusted contract or source baseline changed during the attempt. Rebaseline before continuing.");
      const changed=changedFiles(candidate.files,await tree(candidateRoot));
      if(!changed.length||changed.some(f=>!allowed(f))){await reject(attempt,"No patch, or changes outside the permitted files.");continue;}
      let size=0;
      for(const file of changed){
        if(!(file in candidate.files)){size+=(await readFile(path.join(candidateRoot,file),"utf8")).split("\n").length;continue;}
        let diff="";
        try{diff=execFileSync("git",["diff","--no-index","--numstat","--",path.join(foundationRoot,file),path.join(candidateRoot,file)],{encoding:"utf8"})}
        catch(error){const result=error as {status?:number;stdout?:string};if(result.status!==1)throw error;diff=result.stdout||"";}
        for(const line of diff.trim().split("\n").filter(Boolean)){const [added,removed]=line.split("\t");size+=Number.isFinite(Number(added))&&Number.isFinite(Number(removed))?Number(added)+Number(removed):Infinity;}
      }
      if(size>300){await reject(attempt,"The patch exceeds 300 changed lines. Use a smaller intervention.");continue;}
      const testLog=path.join(runDirectory,`tests-${attempt}.log`);
      try{await runProcess(path.join(productRoot,"node_modules/.bin/vitest"),["run"],{cwd:candidateRoot,outputFile:testLog,timeoutMs:remaining()})}
      catch(error){
        if(interrupted||Date.now()>=deadline)throw error;
        await reject(attempt,{issue:"Product tests failed. The next attempt starts from the baseline.",testEvidence:(await readFile(testLog,"utf8")).slice(-6000)});continue;
      }
      state=await save({...state,phase:"checking"});
      const measuredTreeHash=sha(await tree(candidateRoot));
      const candidateFile=path.join(runDirectory,`candidate-${attempt}.json`);
      const measured=await measure(candidateRoot,candidateFile,remaining());
      if(sha(await tree(candidateRoot))!==measuredTreeHash)throw new Error("The candidate changed while checks were running. It needs a fresh measurement.");
      if(!sameEpoch(baseline,measured))throw new Error("The candidate and baseline use different evaluation epochs.");
      const decision=candidateDecision(baseline.scorecard,measured.scorecard,failure.caseId);
      await atomicJson(path.join(runDirectory,`decision-${attempt}.json`),decision);
      if(!decision.keep){await reject(attempt,decision.issues);continue;}
      return await save({...state,phase:"awaiting_review",latest:candidateFile,reason:"The target improved and the regression ratchet passed. One candidate is waiting for engineer review.",pending:{candidateRoot,candidateTreeHash:measuredTreeHash,branch:candidate.branch,changedFiles:changed,sourceHash:originalSourceHash,baselineFiles:candidate.files,scorecard:candidateFile,summary:outputFile}});
    }
    return await save({...state,phase:"bounded_stop",reason:"The active run reached its time or candidate limit. Review its evidence before another run."});
  }catch(error){return await save({...state,phase:"needs_input",reason:error instanceof Error?error.message:"The loop needs review."});}
}

export const reviewCandidate = (accept:boolean) => withLoopLock(()=>reviewCandidateLocked(accept));
async function reviewCandidateLocked(accept:boolean){
  const state=await optionalJson<LoopState>(stateFile);
  if(!state?.pending||state.phase!=="awaiting_review")throw new Error("No candidate is waiting for review.");
  if(accept){
    if(await sourceHash()!==state.pending.sourceHash)throw new Error("The source changed after this candidate was measured. Rebaseline before accepting it.");
    const changed=changedFiles(state.pending.baselineFiles,await tree(state.pending.candidateRoot));
    if(sha(await tree(state.pending.candidateRoot))!==state.pending.candidateTreeHash)throw new Error("The candidate changed after grading. Measure the new contents before accepting them.");
    if(sha(changed.sort())!==sha([...state.pending.changedFiles].sort())||changed.some(f=>!allowed(f)))throw new Error("The candidate changed after its scope check.");
    for(const file of changed)if(await fileHash(path.join(productRoot,file))!==(state.pending.baselineFiles[file]||"missing"))throw new Error(`The engineer changed ${file} after the baseline. Rebaseline before accepting.`);
    for(const file of changed){await mkdir(path.dirname(path.join(productRoot,file)),{recursive:true});await copyFile(path.join(state.pending.candidateRoot,file),path.join(productRoot,file));}
  }
  const {pending,...rest}=state;
  await atomicJson(path.join(state.runDirectory!,"human-decision.json"),{accepted:accept,candidate:pending.branch,at:new Date().toISOString()});
  return save({...rest,phase:"idle",reason:accept?"The engineer accepted the local patch. The next run establishes a fresh baseline. Release still requires the separate final product check.":"The engineer rejected the candidate. Add steering in feedback.md before the next attempt."});
}

export async function watchLoop(){
  console.info("Watching the question set and pipeline. Press Ctrl+C to stop.");
  let stopped=false;process.once("SIGINT",()=>{stopped=true});process.once("SIGTERM",()=>{stopped=true});
  let last="",nextSweep=0;
  const sweepMinutes=Number(process.env.RAG_RECHECK_MINUTES||"30");
  if(!Number.isFinite(sweepMinutes)||sweepMinutes<1)throw new Error("RAG_RECHECK_MINUTES must be at least 1.");
  while(!stopped){
    const previous=await optionalJson<LoopState>(stateFile);
    const sweep=previous?.phase==="goal_reached"&&Date.now()>=nextSweep;
    const state=await runLoop({force:sweep});
    if(state.phase==="goal_reached"&&(!nextSweep||sweep))nextSweep=Date.now()+sweepMinutes*60_000;
    const update=`${state.phase}: ${state.reason||state.target||""}`;
    if(update!==last){console.info(update);last=update}
    await new Promise<void>(resolve=>{const t=setTimeout(resolve,15_000);if(stopped){clearTimeout(t);resolve()}});
  }
}
