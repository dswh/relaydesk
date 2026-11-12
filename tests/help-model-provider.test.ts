import { afterEach, describe, expect, it, vi } from "vitest";
import { generateText, Output } from "ai";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

import { getHelpChatConfig } from "../src/lib/help-chat-config";
import { helpLanguageModel, hasHelpModelKey } from "../src/lib/ai/help-model-provider";
import { createHelpEmbedding, createHelpEmbeddings } from "../src/lib/ai/help-embeddings";
import { requestBudget, reserveModelSpend } from "../src/lib/ai/help-model-budget";

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
function configure(){
  vi.stubEnv("RELAYDESK_HELP_MODEL_PROVIDER","openrouter");
  vi.stubEnv("RELAYDESK_OPENROUTER_PROVIDERS","openai");
  vi.stubEnv("OPENROUTER_API_KEY","unit-test-key");
  vi.stubEnv("RELAYDESK_MODEL_BUDGET_FILE","");
  vi.stubEnv("RELAYDESK_HELP_EMBEDDING_MODE","gateway");
}

describe("OpenRouter model access",()=>{
  it("uses OpenRouter authentication, a pinned model, and a pinned upstream",async()=>{
    configure();
    const requests:Array<{url:string;body:Record<string,unknown>;headers:Headers}>=[];
    vi.stubGlobal("fetch",vi.fn(async(input:string,init:RequestInit)=>{
      requests.push({url:String(input),body:JSON.parse(String(init.body)),headers:new Headers(init.headers)});
      return Response.json({id:"chat-unit-test",object:"chat.completion",created:1,model:"openai/gpt-4.1-mini",choices:[{index:0,message:{role:"assistant",content:"A documented answer."},finish_reason:"stop"}],usage:{prompt_tokens:10,completion_tokens:4,total_tokens:14}});
    }));
    const result=await generateText({model:helpLanguageModel("openai/gpt-4.1-mini"),prompt:"A synthetic test question",maxOutputTokens:20,maxRetries:0});
    expect(result.text).toBe("A documented answer.");
    expect(requests[0]!.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(requests[0]!.headers.get("authorization")).toBe("Bearer unit-test-key");
    expect(requests[0]!.body).toMatchObject({model:"openai/gpt-4.1-mini",provider:{order:["openai"],allow_fallbacks:false,require_parameters:true}});
  });

  it("requests and validates a structured binary judge response through OpenRouter",async()=>{
    configure();let body:Record<string,unknown>={};
    vi.stubGlobal("fetch",vi.fn(async(_input:string,init:RequestInit)=>{
      body=JSON.parse(String(init.body));
      return Response.json({id:"judge-unit-test",object:"chat.completion",created:1,model:"openai/gpt-4.1",choices:[{index:0,message:{role:"assistant",content:JSON.stringify({verdict:"fail",critique:"The evidence does not support the promise."})},finish_reason:"stop"}],usage:{prompt_tokens:20,completion_tokens:12,total_tokens:32}});
    }));
    const result=await generateText({model:helpLanguageModel("openai/gpt-4.1"),prompt:"Judge the supplied synthetic answer.",maxOutputTokens:40,maxRetries:0,output:Output.object({schema:z.object({verdict:z.enum(["pass","fail"]),critique:z.string()})})});
    expect(result.output.verdict).toBe("fail");
    expect(body.response_format).toMatchObject({type:"json_schema",json_schema:{strict:true}});
  });

  it("uses OpenRouter for both document indexing and query embeddings",async()=>{
    configure();const urls:string[]=[];
    vi.stubGlobal("fetch",vi.fn(async(input:string,init:RequestInit)=>{
      urls.push(String(input));const body=JSON.parse(String(init.body));
      const count=Array.isArray(body.input)?body.input.length:1;
      return Response.json({object:"list",model:"openai/text-embedding-3-small",data:Array.from({length:count},(_,index)=>({index,object:"embedding",embedding:[0.1,0.2]})),usage:{prompt_tokens:count,total_tokens:count}});
    }));
    const config=getHelpChatConfig();
    expect((await createHelpEmbeddings(["First public document","Second public document"],config)).vectors).toHaveLength(2);
    expect((await createHelpEmbedding("A customer question",config)).vector).toEqual([0.1,0.2]);
    expect(urls).toEqual(["https://openrouter.ai/api/v1/embeddings","https://openrouter.ai/api/v1/embeddings"]);
  });

  it("fails closed if the chosen provider key is missing",()=>{
    configure();vi.stubEnv("OPENROUTER_API_KEY","");vi.stubEnv("AI_GATEWAY_API_KEY","another-provider-test-key");
    expect(hasHelpModelKey()).toBe(false);
    expect(()=>helpLanguageModel("openai/gpt-4.1-mini")).toThrow("OPENROUTER_API_KEY");
  });
});

describe("model testing spend guard",()=>{
  it("reserves a conservative token ceiling and blocks unknown or unbounded requests",()=>{
    const body={model:"openai/gpt-4.1-mini",messages:[{role:"user",content:"Hello"}],max_tokens:500};
    expect(requestBudget(body,false).reservedUSD).toBeGreaterThan(500*1.6/1_000_000);
    expect(()=>requestBudget({...body,max_tokens:undefined},false)).toThrow("explicit output limit");
    expect(()=>requestBudget({...body,model:"openrouter/auto"},false)).toThrow("approved price ceiling");
  });
  it("enforces one shared budget across concurrent reservations",async()=>{
    const directory=await mkdtemp(path.join(os.tmpdir(),"relaydesk-model-budget-"));
    try{
      const file=path.join(directory,"ledger.json");
      const results=await Promise.allSettled([reserveModelSpend(file,0.05,0.03),reserveModelSpend(file,0.05,0.03)]);
      expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
      expect(JSON.parse(await readFile(file,"utf8"))).toMatchObject({reservedUSD:0.03,requests:1});
    }finally{await rm(directory,{recursive:true,force:true})}
  });
  it("blocks an over-budget SDK call before sending HTTP",async()=>{
    configure();const directory=await mkdtemp(path.join(os.tmpdir(),"relaydesk-budget-block-"));
    try{
      vi.stubEnv("RELAYDESK_MODEL_BUDGET_FILE",path.join(directory,"ledger.json"));
      vi.stubEnv("RELAYDESK_MODEL_BUDGET_USD","0.000001");
      const transport=vi.fn();vi.stubGlobal("fetch",transport);
      await expect(generateText({model:helpLanguageModel("openai/gpt-4.1-mini"),prompt:"A synthetic budget test",maxOutputTokens:20,maxRetries:0})).rejects.toThrow("budget would exceed");
      expect(transport).not.toHaveBeenCalled();
    }finally{await rm(directory,{recursive:true,force:true})}
  });
});
