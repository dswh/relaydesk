import {execFileSync} from "node:child_process";
import {mkdir,writeFile,readFile,symlink,rm} from "node:fs/promises";
import path from "node:path";
import {afterAll,beforeEach,describe,expect,it,vi} from "vitest";
const sandbox=vi.hoisted(()=>({root:`/tmp/relaydesk-continuation-${process.pid}-${Date.now()}`}));
vi.mock("../evaluations/rag-lab/store",async original=>({...await original<typeof import("../evaluations/rag-lab/store")>(),dataRoot:sandbox.root}));
vi.mock("../evaluations/rag-lab/loop",async original=>({...await original<typeof import("../evaluations/rag-lab/loop")>(),runProcess:vi.fn()}));
import {atomicJson,sha} from "../evaluations/rag-lab/store";
import {productRoot,runProcess} from "../evaluations/rag-lab/loop";
import {workspaceFileHashes} from "../evaluations/rag-lab/worktree";
import {addDemoQuestion,demoState,demoView,reviewDemo,runDemo,watchDemo,type DemoState} from "../evaluations/rag-lab/demo/runner";
import {engineeringReviewSchema,type DemoQuestion,type RetrievalReport} from "../evaluations/rag-lab/demo/contract";
const files=["src/lib/ai/help-chat.ts","src/lib/help-chat-config.ts","src/lib/knowledge-repository.ts"];
const first:DemoQuestion={id:"D01",family:"follow-up",question:"How do I verify my SSO domain?",expectedSource:"kb_14"};
const extra:DemoQuestion={id:"D02",family:"new-question",question:"How do I request a complete usage export?",expectedSource:"kb_22"};
const review={reviewer:"Test engineer",reviewerType:"human",rationale:"The shared context repair and preserved regression checks support this local change."} as const;
let serial=0;
async function fixture(){
 const id=`fixture-${++serial}`,dir=path.join(sandbox.root,"retrieval-demo",id),candidate=path.join(sandbox.root,id);
 await mkdir(dir,{recursive:true});await mkdir(candidate,{recursive:true});execFileSync("git",["init","-q",candidate]);
 for(const f of files){await mkdir(path.dirname(path.join(candidate,f)),{recursive:true});await writeFile(path.join(candidate,f),"export const healthy=true;\n")}
 await writeFile(path.join(candidate,".gitignore"),"node_modules/\n");execFileSync("git",["-C",candidate,"add","src",".gitignore"]);await symlink(path.join(productRoot,"node_modules"),path.join(candidate,"node_modules"),"dir");
 const report:RetrievalReport={schemaVersion:1,measuredAt:"2026-11-13T00:00:00Z",manifest:{datasetHash:sha([first]),corpusHash:"corpus",contractHash:"contract",modelsHash:"models",productHash:await sourceHash(candidate),split:"development",repeats:3},cases:[row(first)]};
 const baseline=path.join(dir,"epoch-1-baseline.json"),candidateReport=path.join(dir,"epoch-1-candidate-1.json");
 await atomicJson(baseline,report);await atomicJson(candidateReport,report);await atomicJson(path.join(dir,"development.json"),[first]);await atomicJson(path.join(dir,"heldout.json"),[first]);
 const state:DemoState={id,phase:"awaiting_review",reason:"A measured candidate awaits review.",createdAt:report.measuredAt,updatedAt:report.measuredAt,baseCommit:"fixture",historicalCommit:"historical",baselineRoot:candidate,currentRoot:candidate,epoch:1,datasetHash:report.manifest.datasetHash,heldoutHash:"heldout",contractHash:"contract",attempts:1,baseline,candidate:candidateReport,pending:{root:candidate,changedFiles:[files[1]!],treeHash:sha(await workspaceFileHashes(candidate)),decisionFile:path.join(dir,"decision.json")},events:[]};
 await atomicJson(path.join(dir,"state.json"),state);return {id,dir,candidate,state};
}
function row(q:DemoQuestion){return {...q,attempts:[1,2,3].map(repeat=>({repeat,query:q.question,rank:1,approved:true,sourceIds:[q.expectedSource],traceId:`fixture-${q.id}-${repeat}`}))}}
async function sourceHash(root:string){return sha(await Promise.all(files.map(async f=>[f,sha(await readFile(path.join(root,f)))])))}
beforeEach(()=>{
 vi.mocked(runProcess).mockReset();
 vi.mocked(runProcess).mockImplementation(async (_command,args,options)=>{
  const i=args.indexOf("--out");if(i>=0){const tasks:DemoQuestion[]=JSON.parse(await readFile(args[args.indexOf("--dataset")+1]!,"utf8"));const root=args[args.indexOf("--product")+1]!;await atomicJson(args[i+1]!,{schemaVersion:1,measuredAt:new Date().toISOString(),manifest:{datasetHash:sha(tasks),corpusHash:"corpus",contractHash:"contract",modelsHash:"models",productHash:await sourceHash(root),split:"development",repeats:3},cases:tasks.map(row)});}else await writeFile(options.outputFile,"Offline test suite passed.\n");
 });
});
afterAll(async()=>{await rm(sandbox.root,{recursive:true,force:true})});
describe("review and new-question continuation",()=>{
 it("records who reviewed the patch without converting an assistant into a human reviewer",async()=>{
  const f=await fixture();await reviewDemo(f.id,true,{...review,reviewer:"Codex",reviewerType:"assistant"});
  const saved=JSON.parse(await readFile(path.join(f.dir,"epoch-1-engineering-decision.json"),"utf8"));expect(saved).toMatchObject({accepted:true,reviewerType:"assistant",reviewer:"Codex"});expect((await demoState(f.id))?.phase).toBe("prepared");expect((await demoView(f.id)).rounds?.[0]?.review?.reviewerType).toBe("assistant");
 });
 it("requires a reason and rejects accepting a patch modified after measurement",async()=>{
  expect(engineeringReviewSchema.safeParse({reviewer:"A",reviewerType:"human",rationale:"yes"}).success).toBe(false);
  const f=await fixture();await writeFile(path.join(f.candidate,files[1]!),"export const changed=true;\n");await expect(reviewDemo(f.id,true,review)).rejects.toThrow("changed after measurement");expect((await demoState(f.id))?.phase).toBe("awaiting_review");
 });
 it("makes no measurement while review is pending, even after a question is added",async()=>{
  const f=await fixture(),q=path.join(f.dir,"new.json");await atomicJson(q,extra);await addDemoQuestion(f.id,q);expect((await runDemo(f.id)).phase).toBe("awaiting_review");expect(runProcess).not.toHaveBeenCalled();
 });
 it("lets the watcher measure the expanded dataset after review and keeps the two rounds separate",async()=>{
  const f=await fixture();await reviewDemo(f.id,true,review);const q=path.join(f.dir,"new.json");await atomicJson(q,extra);await addDemoQuestion(f.id,q);
  const result=await watchDemo(f.id,{once:true,answers:false});expect(result?.phase).toBe("goal_reached");expect(result?.epoch).toBe(2);expect(result?.candidate).toBeUndefined();expect(result?.heldoutCandidate).toBeUndefined();
  const view=await demoView(f.id);expect(view.rounds?.map(r=>r.baseline?.cases.length)).toEqual([1,2]);expect(view.rounds?.[0]?.review?.accepted).toBe(true);expect(view.rounds?.[1]?.candidate).toBeUndefined();expect(view.state?.events.some(e=>e.message.includes("watcher noticed"))).toBe(true);
  const calls=vi.mocked(runProcess).mock.calls.length;await watchDemo(f.id,{once:true,answers:false});expect(runProcess).toHaveBeenCalledTimes(calls);
 });
 it("keeps the old baseline after rejection and allows an unchanged pending watcher to stop",async()=>{
  const f=await fixture();await reviewDemo(f.id,false,review);expect((await demoState(f.id))?.currentRoot).toBe(f.state.currentRoot);expect((await demoView(f.id)).rounds?.[0]?.review?.accepted).toBe(false);
  const pending=await fixture(),stop=new AbortController();const watching=watchDemo(pending.id,{intervalMs:5,signal:stop.signal});stop.abort();await watching;expect(runProcess).not.toHaveBeenCalled();
 });
});
