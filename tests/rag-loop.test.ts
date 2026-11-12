import { describe, expect, it } from "vitest";
import { captureRagTrace, observeRagStage } from "../src/lib/ai/rag-observability";
import { makeScorecard, candidateDecision, selectFailure, type ScoredCase } from "../evaluations/rag-lab/scorecard";
import { balancedExamples, confusion } from "../evaluations/rag-lab/judge";
import { calibrationRows, sha, hardChecks, type Capture, type HumanFeedback } from "../evaluations/rag-lab/store";
import { loadHelpChatDataset } from "../evaluations/help-chat/dataset";
import type { HelpChatAnswer } from "../src/lib/ai/help-chat";

function task(id: string, pass: boolean, critical = false): ScoredCase {
  return { caseId: id, question: `Question ${id}`, critical, attempts: [1,2,3].map(repeat => ({ repeat, checks: [{ key: "route", pass, reason: "Expected route" }], semantic: { verdict: pass ? "pass" : "fail", critique: "The supplied evidence determines the result." }, answer: "Measured test response", durationMs: 10 })) };
}

describe("RAG feedback loop", () => {
  it("requires every question and repeat to pass before declaring the goal", () => {
    const all = makeScorecard([task("A",true,true),task("B",true)],"live");
    expect(all).toMatchObject({ totalScore:100,passedQuestions:2,totalQuestions:2,goalReached:true });
    const oneFailed = makeScorecard([task("A",true,true),task("B",false)],"live");
    expect(oneFailed).toMatchObject({ totalScore:50,goalReached:false });
    const incomplete = task("C",true);incomplete.attempts.pop();
    expect(makeScorecard([incomplete],"live")).toMatchObject({ totalScore:null,goalReached:false });
  });

  it("keeps unscored semantics distinct from a failure or a passing fixture", () => {
    const unscored=task("A",true,true);unscored.attempts.forEach(a=>{delete a.semantic});
    expect(makeScorecard([unscored],"fixture")).toMatchObject({totalScore:null,criticalFailures:0,criticalUnscored:1,goalReached:false});
    expect(makeScorecard([task("A",true)],"fixture").goalReached).toBe(false);
  });

  it("permits a small repair while preserving other known failures", () => {
    const baseline=makeScorecard([task("A",false,true),task("B",false,true),task("C",true)],"live");
    const candidate=makeScorecard([task("A",true,true),task("B",false,true),task("C",true)],"live");
    expect(candidateDecision(baseline,candidate,"A")).toMatchObject({keep:true,goalReached:false});
  });

  it("rejects a higher total score that breaks a protected passing case", () => {
    const baseline=makeScorecard([task("A",false),task("B",false),task("C",true,true)],"live");
    const candidate=makeScorecard([task("A",true),task("B",true),task("C",false,true)],"live");
    const decision=candidateDecision(baseline,candidate,"A");
    expect(candidate.totalScore).toBeGreaterThan(baseline.totalScore!);
    expect(decision.keep).toBe(false);
    expect(decision.issues.some(i=>i.includes("critical"))).toBe(true);
  });

  it("selects a protected failure before other cases", () => {
    expect(selectFailure(makeScorecard([task("A",false),task("Z",false,true)],"live"))?.caseId).toBe("Z");
  });

  it("rejects newly unstable repeated results", () => {
    const baseline=makeScorecard([task("A",false),task("B",true)],"live");
    const mixed=task("B",true);mixed.attempts[1]!.semantic!.verdict="fail";
    const candidate=makeScorecard([task("A",true),mixed],"live");
    expect(candidateDecision(baseline,candidate,"A").keep).toBe(false);
  });
  it("rejects worse repetitions even when a question was already failing",()=>{
    const unstable=task("B",false);unstable.attempts[0]!.semantic!.verdict="pass";
    const baseline=makeScorecard([task("A",false),unstable],"live");
    const candidate=makeScorecard([task("A",true),task("B",false)],"live");
    expect(candidateDecision(baseline,candidate,"A").issues).toContain("More failed repetitions: B.");
  });
  it("includes both human verdicts when selecting a small judge example set",()=>{
    const rows=Array.from({length:12},(_,i)=>({trace:{id:String(i).padStart(2,"0")},label:{verdict:i<10?"pass":"fail"}})) as Parameters<typeof balancedExamples>[0];
    const chosen=balancedExamples(rows);
    expect(chosen.filter(r=>r.label.verdict==="pass")).toHaveLength(4);
    expect(chosen.filter(r=>r.label.verdict==="fail")).toHaveLength(2);
  });

  it("reports failure detection separately from acceptance when failures are rare", () => {
    const report=confusion([...Array.from({length:95},()=>({human:"pass" as const,judge:"pass" as const})),...Array.from({length:5},()=>({human:"fail" as const,judge:"pass" as const}))]);
    expect(report).toMatchObject({failureDetectionRate:0,correctAcceptanceRate:1,failures:5,passes:95});
  });

  it("captures nested real operations without changing their results", async () => {
    const trace=await captureRagTrace({question:"example"},()=>observeRagStage("retrieval","retriever",{},()=>observeRagStage("embedding","embedding",{},async()=>({value:7}),r=>({...r})),r=>({...r})),{metadata:{synthetic:true}});
    expect(trace.output).toEqual({value:7});
    expect(trace.spans).toHaveLength(2);
    expect(trace.spans[0]!.parentId).toBe(trace.id);
    expect(trace.spans[1]!.parentId).toBe(trace.spans[0]!.id);
    await expect(observeRagStage("error","chain",{},async()=>{throw new Error("original failure")},()=>({}))).rejects.toThrow("original failure");
  });

  it("checks raw citation markers even if the formatted citation list omits an invalid marker", async () => {
    const evalCase=(await loadHelpChatDataset())[0]!;
    const answer:HelpChatAnswer={answer:"A claim [not_an_approved_source]",citations:[],mode:"fixture",model:"test",outcome:"answered",prompt:"",retrieved:[]};
    expect(hardChecks(answer,evalCase).find(c=>c.key==="citation_membership")?.pass).toBe(false);
  });
  it("rejects a source outside the approved public corpus even when the answer cites it",async()=>{
    const evalCase=(await loadHelpChatDataset())[0]!;
    const answer={answer:"An internal claim [private_ticket]",outcome:"answered",retrieved:[{sourceId:"private_ticket"}]} as unknown as HelpChatAnswer;
    expect(hardChecks(answer,evalCase).find(c=>c.key==="approved_sources")?.pass).toBe(false);
  });

  it("excludes fixture, changed, and repeated identical outputs from judge calibration", () => {
    const answer={answer:"Identical output",retrieved:[]} as unknown as HelpChatAnswer;
    const base={id:"a",mode:"live",family:"same-question",evalCase:{question:"Question"},answer};
    const traces=[base,{...base,id:"b"},{...base,id:"c",mode:"fixture"},{...base,id:"d",answer:{...answer,answer:"Changed after labeling"}}];
    const labels=new Map(traces.map(t=>[t.id,{traceId:t.id,traceHash:sha(answer),verdict:"pass",critique:"This is a unit-test label."} as HumanFeedback]));
    const rows=calibrationRows([{traces} as unknown as Capture],labels);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.trace.id).toBe("a");
  });
});
