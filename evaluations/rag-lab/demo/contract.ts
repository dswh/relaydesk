import { z } from "zod";
export const questionSchema = z.object({ id: z.string().regex(/^[A-Z][0-9]{2}$/), family: z.string().min(1), question: z.string().min(10), followUp: z.string().min(5).optional(), expectedSource: z.string().regex(/^kb_[0-9]+$/) }).strict();
export const questionsSchema = z.array(questionSchema).min(1).max(30).superRefine((rows, ctx) => { if (new Set(rows.map(r => r.id)).size !== rows.length)
    ctx.addIssue({ code: "custom", message: "Question IDs must be unique." }); });
export type DemoQuestion = z.infer<typeof questionSchema>;
export type RetrievalAttempt = {
    repeat: number;
    query: string;
    rank: number | null;
    approved: boolean;
    sourceIds: string[];
    traceId: string;
    answer?: {
        text: string;
        outcome: string;
        citationIds: string[];
        traceId: string;
        quality: "unscored";
    };
};
export type RetrievalCase = DemoQuestion & {
    attempts: RetrievalAttempt[];
};
export type RetrievalReport = {
    schemaVersion: 1;
    measuredAt: string;
    manifest: {
        datasetHash: string;
        corpusHash: string;
        contractHash: string;
        productHash: string;
        modelsHash: string;
        split: string;
        repeats: 3;
    };
    cases: RetrievalCase[];
};
export const demoContract = { version: 1, repeats: 3, metric: "expected_approved_source_rank_1", target: 1, maxCandidates: 3, maxMinutes: 20, maxChangedLines: 100, answerQuality: "unscored", note: "This measures retrieval ranking on synthetic product questions. It does not establish answer correctness or validate an LLM judge." } as const;
export function retrievalScore(report: RetrievalReport) {
    const rows = report.cases.map(c => ({ ...c, pass: c.attempts.length === 3 && c.attempts.every(a => a.rank === 1 && a.approved) }));
    const complete = rows.length > 0 && rows.every(c => c.attempts.length === 3 && [...c.attempts.map(a => a.repeat)].sort().join(",") === "1,2,3");
    const passing = rows.filter(c => c.pass).length;
    return { metric: demoContract.metric, total: rows.length, passing, score: complete ? 100 * passing / rows.length : null, complete, goalReached: complete && passing === rows.length, answerQuality: "unscored" as const, rows };
}
export function retrievalDecision(before: RetrievalReport, after: RetrievalReport, { requireImprovement = true, target }: { requireImprovement?:boolean; target?:string } = {}) {
    const issues: string[] = [];
    const b = retrievalScore(before), a = retrievalScore(after);
    for (const k of ["datasetHash", "corpusHash", "contractHash", "modelsHash", "split", "repeats"] as const)
        if (before.manifest[k] !== after.manifest[k])
            issues.push(`Comparison changed ${k}.`);
    if (!b.complete || !a.complete)
        issues.push("Every question requires three independent live retrievals.");
    if (before.cases.length !== after.cases.length || before.cases.some(c => !after.cases.some(x => x.id === c.id)))
        issues.push("Question coverage changed.");
    for (const row of a.rows) {
        const prev = b.rows.find(c => c.id === row.id);
        if (prev?.pass && !row.pass)
            issues.push(`Regression: ${row.id}.`);
        if (row.attempts.some(x => !x.approved))
            issues.push(`Unapproved source: ${row.id}.`);
        if (prev && row.attempts.filter(x => x.rank !== 1).length > prev.attempts.filter(x => x.rank !== 1).length)
            issues.push(`More failed repeats: ${row.id}.`);
    }
    if(target&&(!b.rows.some(r=>r.id===target&&!r.pass)||!a.rows.some(r=>r.id===target&&r.pass)))issues.push("The selected retrieval failure was not repaired.");
    if (requireImprovement && a.passing <= b.passing)
        issues.push("No additional questions retrieve the expected source first.");
    return { keep: issues.length === 0, issues, before: b.score, after: a.score, answerQuality: "unscored" as const };
}
export function allowedDemoFile(file: string) { return file === "src/lib/ai/help-chat.ts" || file === "src/lib/help-chat-config.ts" || file === "src/lib/knowledge-repository.ts" || /^tests\/rag-repairs\/[a-zA-Z0-9_-]+\.test\.ts$/.test(file); }
export function selectedRetrievalFailure(report: RetrievalReport) { return retrievalScore(report).rows.find(r => !r.pass); }

export const demoReviewSchema=z.object({id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),traceId:z.uuid(),verdict:z.enum(["pass","fail"]),critique:z.string().trim().min(8).max(4000),reviewer:z.string().trim().min(2).max(100)}).strict();

export const engineeringReviewSchema=z.object({
    reviewer:z.string().trim().min(2).max(100),
    reviewerType:z.enum(["human","assistant"]),
    rationale:z.string().trim().min(20).max(4000),
}).strict();
export type EngineeringReview=z.infer<typeof engineeringReviewSchema> & {accepted:boolean;at:string;scope:string};
export const engineeringDecisionSchema=engineeringReviewSchema.extend({id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),accepted:z.boolean()}).strict();
