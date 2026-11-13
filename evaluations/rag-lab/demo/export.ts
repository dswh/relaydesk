import { mkdir,readFile,writeFile } from "node:fs/promises";
import path from "node:path";
import {productRoot} from "../loop";
import {labRoot,dataRoot,atomicJson,optionalJson} from "../store";
import {demoView} from "./runner";

export async function exportDemo(id:string,output:string){
 const view=await demoView(id);
 if(!view.state||!view.baseline)throw new Error("Measure this run before exporting it.");
 const out=path.resolve(output);
 if(!out.startsWith(productRoot+path.sep))throw new Error("Export into a directory inside this feature repository.");
 const s=view.state;
 const evidenceRoot=path.join(dataRoot,"retrieval-demo",s.id);
 const reproductionReceipt=await optionalJson(path.join(evidenceRoot,"reproduction-receipt.json"));
 const flowControlProof=await optionalJson(path.join(evidenceRoot,"new-question-gate.json"));
 const snapshot={...view,reproductionReceipt,flowControlProof,state:{id:s.id,phase:s.phase,reason:s.reason,createdAt:s.createdAt,updatedAt:s.updatedAt,baseCommit:s.baseCommit,historicalCommit:s.historicalCommit,datasetHash:s.datasetHash,heldoutHash:s.heldoutHash,contractHash:s.contractHash,epoch:s.epoch,attempts:s.attempts,events:s.events,pending:s.pending?{changedFiles:s.pending.changedFiles}:undefined},patch:view.patch?.replaceAll(productRoot+path.sep,"")};
 const data=JSON.stringify(snapshot).replaceAll("</","<\\/");
 let html=await readFile(path.join(labRoot,"demo/workshop.html"),"utf8");
 const live="const res=await fetch('/api/demo');if(!res.ok)throw new Error('Unable to load the run.');const d=await res.json();";
 if(!html.includes(live))throw new Error("The replay template changed. Update the exporter before using it.");
 html=html.replace(live,`const d=${data};`);
 html=html.replace('<h1>A follow-up loses its context</h1>','<h1>Recorded RAG retrieval improvement</h1>');
 html=html.replace('<p>The help assistant',`<p><strong>Read-only replay of live measurements.</strong> Captured run ${s.id}. This page sends no model requests and cannot record an approval.</p><p>The help assistant`);
 html=html.replace(/<details><summary>Record your review of an actual answer<\/summary>[\s\S]*?<\/details>/,"");
 html=html.replace(/\$\('review-form'\)\.onsubmit=[\s\S]*?\$\('refresh'\)\.onclick=refresh;refresh\(\);setInterval\(refresh,5000\);/,"refresh();");
 // Keep a hidden select because answer rendering preserves its selection.
 html=html.replace('<div id="answers"></div>','<div id="answers"></div><select id="review-answer" hidden aria-hidden="true"></select>');
 html=html.replace('<button id="refresh">Refresh evidence</button>',"");
 html=html.replace('href="/"','href="http://127.0.0.1:4181/"').replace('href="/workshop"','href="http://127.0.0.1:4181/workshop"');
 await mkdir(out,{recursive:true});await atomicJson(path.join(out,"report.json"),snapshot);await writeFile(path.join(out,"report.html"),html);
 return {json:path.join(out,"report.json"),html:path.join(out,"report.html"),scope:"Read-only replay of live evidence. Answer quality remains unscored."};
}
