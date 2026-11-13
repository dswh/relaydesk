import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {productRoot} from "../loop";
import {labRoot,dataRoot,atomicJson,optionalJson} from "../store";
import {demoView} from "./runner";

export async function exportDemo(id:string,output:string){
 const view=await demoView(id);
 if(!view.state||!view.baseline)throw new Error("Measure this run before exporting it.");
 const out=path.resolve(output);
 if(!out.startsWith(productRoot+path.sep))throw new Error("Export into a directory inside this feature repository.");
 const s=view.state,evidenceRoot=path.join(dataRoot,"retrieval-demo",s.id);
 const reproductionReceipt=await optionalJson(path.join(evidenceRoot,"reproduction-receipt.json"));
 const flowControlProof=await optionalJson(path.join(evidenceRoot,"new-question-gate.json"));
 const continuationReceipt=await optionalJson(path.join(evidenceRoot,"continuation-receipt.json"));
 const raw={...view,reproductionReceipt,flowControlProof,continuationReceipt,state:{id:s.id,phase:s.phase,reason:s.reason,createdAt:s.createdAt,updatedAt:s.updatedAt,baseCommit:s.baseCommit,historicalCommit:s.historicalCommit,datasetHash:s.datasetHash,heldoutHash:s.heldoutHash,contractHash:s.contractHash,epoch:s.epoch,attempts:s.attempts,events:s.events,pending:s.pending?{changedFiles:s.pending.changedFiles}:undefined}};
 const snapshot=JSON.parse(JSON.stringify(raw).replaceAll(productRoot+path.sep,""));
 const data=JSON.stringify(snapshot).replaceAll("</","<\\/");
 let html=await readFile(path.join(labRoot,"demo/workshop.html"),"utf8");
 const loader="async function loadDemo(){const res=await fetch('/api/demo');if(!res.ok)throw new Error('Unable to load the run.');return res.json();}";
 if(!html.includes(loader)||!html.includes("__DEMO_DATA__"))throw new Error("The replay template changed. Update the exporter before using it.");
 html=html.replace(loader,"async function loadDemo(){return JSON.parse($('recorded-data').textContent);}");
 html=html.replace('data-mode="live"','data-mode="replay"').replace("__DEMO_DATA__",data);
 html=html.replace(/<!-- LIVE_FORMS_START -->[\s\S]*?<!-- LIVE_FORMS_END -->/,"");
 html=html.replace(/\/\/ LIVE_ADAPTER_START[\s\S]*?\/\/ LIVE_ADAPTER_END/,"");
 html=html.replace('<button id="refresh">Refresh evidence</button>',"").replace("__REVIEW_TOKEN__","");
 await mkdir(out,{recursive:true});await atomicJson(path.join(out,"report.json"),snapshot);await writeFile(path.join(out,"report.html"),html);
 return {json:path.join(out,"report.json"),html:path.join(out,"report.html"),scope:"Read-only replay of live evidence. Answer quality remains unscored."};
}
