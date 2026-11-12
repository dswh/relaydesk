import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// USD per million tokens. Requests also enforce these ceilings at OpenRouter.
const prices:Record<string,{prompt:number;completion:number}>={
  "openai/gpt-4.1-mini":{prompt:0.4,completion:1.6},
  "openai/gpt-4.1":{prompt:2,completion:8},
  "openai/text-embedding-3-small":{prompt:0.02,completion:0},
};
type Ledger={reservedUSD:number;requests:number;updatedAt:string};

export function requestBudget(body:Record<string,unknown>,embedding:boolean){
  const price=prices[String(body.model)];
  if(!price)throw new Error("This model has no approved price ceiling in the test budget.");
  if(body.models||body.plugins||body.tools||Number(body.n||1)!==1)throw new Error("The test budget only permits one text response or text embeddings, without tools or plugins.");
  const output=embedding?0:Number(body.max_tokens??body.max_completion_tokens);
  if(!embedding&&(!Number.isInteger(output)||output<1||output>1000))throw new Error("Testing requires an explicit output limit of at most 1000 tokens.");
  // Byte count plus message overhead intentionally overestimates text tokens.
  const input=Buffer.byteLength(JSON.stringify(body),"utf8")+2048;
  const reservedUSD=Math.ceil((input*price.prompt+output*price.completion)*1.05)/1_000_000;
  return {reservedUSD,maxPrice:{...price,request:0}};
}

export async function reserveModelSpend(file:string,limit:number,reservation:number){
  if(!Number.isFinite(limit)||limit<=0||!Number.isFinite(reservation)||reservation<0)throw new Error("Configure a positive model test budget.");
  await mkdir(path.dirname(file),{recursive:true});
  const lock=file+".lock";
  let handle;
  for(let attempt=0;attempt<25;attempt++){
    try{handle=await open(lock,"wx",0o600);break}
    catch(error){if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;await new Promise(r=>setTimeout(r,20))}
  }
  if(!handle)throw new Error("The model budget is locked. Check the active model request before retrying.");
  try{
    let ledger:Ledger={reservedUSD:0,requests:0,updatedAt:""};
    try{ledger=JSON.parse(await readFile(file,"utf8"))}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error}
    if(!Number.isFinite(ledger.reservedUSD)||ledger.reservedUSD<0)throw new Error("The model budget ledger is invalid.");
    const next=Math.round((ledger.reservedUSD+reservation)*1_000_000)/1_000_000;
    if(next>limit)throw new Error(`Model test budget would exceed $${limit.toFixed(2)}. No request was sent.`);
    const temp=file+"."+randomUUID()+".tmp";
    await writeFile(temp,JSON.stringify({reservedUSD:next,requests:ledger.requests+1,updatedAt:new Date().toISOString()}),{mode:0o600});
    await rename(temp,file);
  }finally{await handle.close();await unlink(lock)}
}

export const budgetedOpenRouterFetch:typeof fetch=async(input,init)=>{
  const file=process.env.RELAYDESK_MODEL_BUDGET_FILE;
  if(!file)return fetch(input,init);
  const url=new URL(typeof input==="string"||input instanceof URL?input.toString():input.url);
  if(url.origin!=="https://openrouter.ai"||!["/api/v1/chat/completions","/api/v1/embeddings"].includes(url.pathname)||typeof init?.body!=="string")throw new Error("The test budget rejected an unexpected model request.");
  const body=JSON.parse(init.body) as Record<string,unknown>;
  const budget=requestBudget(body,url.pathname.endsWith("/embeddings"));
  body.provider={...(body.provider as Record<string,unknown>),max_price:budget.maxPrice};
  await reserveModelSpend(file,Number(process.env.RELAYDESK_MODEL_BUDGET_USD),budget.reservedUSD);
  return fetch(input,{...init,body:JSON.stringify(body)});
};
