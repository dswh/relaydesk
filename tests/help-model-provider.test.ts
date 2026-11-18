import { afterEach, describe, expect, it, vi } from "vitest";
import { generateText, Output } from "ai";
import { z } from "zod";

import { getHelpChatConfig } from "../src/lib/help-chat-config";
import { helpLanguageModel, hasHelpModelKey } from "../src/lib/ai/help-model-provider";
import { createHelpEmbedding, createHelpEmbeddings } from "../src/lib/ai/help-embeddings";

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
function configure(){
  vi.stubEnv("RELAYDESK_HELP_MODEL_PROVIDER","openrouter");
  vi.stubEnv("RELAYDESK_OPENROUTER_PROVIDERS","openai");
  vi.stubEnv("OPENROUTER_API_KEY","unit-test-key");
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
