import { describe, it, expect } from "vitest";
import { allowedRepairFile, retrievalContract, retrievalDecision, retrievalScore, selectedRetrievalFailure, questionsSchema, type RetrievalReport } from "../evaluations/rag-lab/retrieval/contract";
function report(values: Array<[
    string,
    number | null
]>, split = "development"): RetrievalReport { return { schemaVersion: 1, measuredAt: "2026-11-13T00:00:00Z", manifest: { datasetHash: "fixed-dataset", corpusHash: "fixed-corpus", contractHash: "fixed-contract", modelsHash: "pinned-models", productHash: "candidate-source", split, repeats: 3 }, cases: values.map(([id, rank]) => ({ id, family: "follow-up", question: `What does ${id} mean?`, expectedSource: "kb_14", attempts: [1, 2, 3].map(repeat => ({ repeat, query: "A real retrieval query", rank, approved: true, sourceIds: ["kb_14"], traceId: `${id}-${repeat}` })) })) }; }
describe("reproducible retrieval improvement", () => {
    it("scores ranking without inventing answer-quality verdicts", () => { const s = retrievalScore(report([["D01", 2], ["D02", 1]])); expect(s).toMatchObject({ score: 50, passing: 1, total: 2, goalReached: false, answerQuality: "unscored" }); expect(selectedRetrievalFailure(report([["D01", 2]]))?.id).toBe("D01"); });
    it("requires exactly three distinct repeats for every question", () => { const r = report([["D01", 1]]); r.cases[0]!.attempts[2]!.repeat = 4; expect(retrievalScore(r).complete).toBe(false); r.cases[0]!.attempts.pop(); expect(retrievalScore(r).score).toBeNull(); });
    it("rejects a higher total that breaks a previously passing question", () => { const b = report([["D01", 2], ["D02", 2], ["D03", 1]]), a = report([["D01", 1], ["D02", 1], ["D03", 3]]); expect(retrievalDecision(b, a)).toMatchObject({ keep: false }); expect(retrievalDecision(b, a).issues).toContain("Regression: D03."); });
    it("rejects changing the question set, corpus, contract, model, or split", () => { for (const k of ["datasetHash", "corpusHash", "contractHash", "modelsHash", "split"] as const) {
        const a = report([["D01", 1]]);
        a.manifest[k] = "changed";
        expect(retrievalDecision(report([["D01", 2]]), a).keep).toBe(false);
    } });
    it("rejects incomplete coverage and unsafe evidence", () => { const a = report([["D01", 1]]); a.cases[0]!.attempts[0]!.approved = false; expect(retrievalDecision(report([["D01", 2]]), a).issues).toContain("Unapproved source: D01."); expect(retrievalDecision(report([["D01", 2], ["D02", 1]]), a).keep).toBe(false); });
    it("accepts a shared ranking improvement with preserved regressions", () => { expect(retrievalDecision(report([["D01", 2], ["D02", 1]]), report([["D01", 1], ["D02", 1]]))).toMatchObject({ keep: true, before: 50, after: 100, answerQuality: "unscored" }); });
    it("requires no regression on untouched questions even when they were already passing", () => { expect(retrievalDecision(report([["H01", 1]], "heldout"), report([["H01", 1]], "heldout"), { requireImprovement: false }).keep).toBe(true); expect(retrievalDecision(report([["H01", 1]], "heldout"), report([["H01", 2]], "heldout"), { requireImprovement: false }).keep).toBe(false); });
    it("preserves safety and grading boundaries", () => { for (const f of ["evaluations/rag-lab/retrieval/contract.ts", "evaluations/rag-lab/retrieval/heldout.json", "src/lib/knowledge.ts", "src/lib/ai/help-model-provider.ts", "package.json", ".env.local"])
        expect(allowedRepairFile(f)).toBe(false); expect(allowedRepairFile("src/lib/help-chat-config.ts")).toBe(true); expect(retrievalContract.maxCandidates).toBe(3); });
    it("rejects duplicate task IDs and malformed source contracts", () => { const q = { id: "D01", family: "context", question: "Where does this request go?", expectedSource: "kb_14" }; expect(questionsSchema.safeParse([q, q]).success).toBe(false); expect(questionsSchema.safeParse([{ ...q, expectedSource: "private-ticket" }]).success).toBe(false); });
});


describe("selected retrieval target",()=>{it("does not accept improvement in a different failed question",()=>{expect(retrievalDecision(report([["D01",2],["D02",3]]),report([["D01",2],["D02",1]]),{target:"D01"}).keep).toBe(false)})});
