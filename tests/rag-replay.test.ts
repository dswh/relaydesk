import {mkdtemp,readFile,rm,mkdir} from "node:fs/promises";
import path from "node:path";
import {describe,it,expect,vi} from "vitest";
vi.mock("../evaluations/rag-lab/demo/runner",()=>({demoView:vi.fn()}));
import {demoView,type DemoState} from "../evaluations/rag-lab/demo/runner";
import {exportDemo} from "../evaluations/rag-lab/demo/export";
import {productRoot} from "../evaluations/rag-lab/loop";
import {demoContract,type RetrievalReport} from "../evaluations/rag-lab/demo/contract";
describe("read-only RAG replay",()=>{
 it("preserves live evidence without API calls, polling, review submission, or machine paths",async()=>{
  await mkdir(path.join(productRoot,".worktrees"),{recursive:true});
  const dir=await mkdtemp(path.join(productRoot,".worktrees/replay-test-"));
  const state:DemoState={id:"recorded-test",phase:"awaiting_review",reason:"A real patch awaits review.",createdAt:"2026-11-13T00:00:00Z",updatedAt:"2026-11-13T00:01:00Z",baseCommit:"source-version",historicalCommit:"historical-version",baselineRoot:productRoot+"/.worktrees/private-baseline",currentRoot:productRoot+"/.worktrees/private-baseline",epoch:1,datasetHash:"dataset-version",heldoutHash:"heldout-version",contractHash:"contract-version",attempts:1,events:[]};
  const baseline:RetrievalReport={schemaVersion:1,measuredAt:state.createdAt,manifest:{datasetHash:"dataset",corpusHash:"corpus",contractHash:"contract",productHash:"product",modelsHash:"models",split:"development",repeats:3},cases:[{id:"D01",family:"follow-up-context",question:"Which source should this use?",expectedSource:"kb_14",attempts:[1,2,3].map(repeat=>({repeat,query:"A recorded query",rank:1,approved:true,sourceIds:["kb_14"],traceId:"recorded-trace",answer:repeat===1?{text:"</script><img src=x onerror=alert(1)>",outcome:"answered",citationIds:["kb_14"],traceId:"answer-trace",quality:"unscored"}:undefined}))}]};
  vi.mocked(demoView).mockResolvedValue({state,baseline,contract:demoContract,patch:productRoot+"/src/lib/help-chat-config.ts",candidate:baseline,heldoutBaseline:baseline,heldoutCandidate:baseline});
  try{const output=await exportDemo("recorded-test",dir);const html=await readFile(output.html,"utf8"),json=await readFile(output.json,"utf8");expect(html).toContain("Read-only replay of live measurements");expect(html).toContain("recorded-trace");expect(html).not.toContain("fetch(");expect(html).not.toContain("setInterval(");expect(html).not.toContain("onsubmit=");expect(html).not.toContain('id="review-form"');expect(html).not.toContain("</script><img");expect(json).not.toContain(productRoot);expect(json).toContain('"answerQuality": "unscored"');}finally{await rm(dir,{recursive:true,force:true})}
 });
});
