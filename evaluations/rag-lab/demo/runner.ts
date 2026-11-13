import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, symlink, writeFile, open, unlink, appendFile } from "node:fs/promises";
import path from "node:path";
import { atomicJson, dataRoot, labRoot, optionalJson, sha } from "../store";
import { runProcess, productRoot } from "../loop";
import { allowedDemoFile, demoReviewSchema, demoContract, questionSchema, questionsSchema, retrievalDecision, retrievalScore, selectedRetrievalFailure, type RetrievalReport } from "./contract";
const root = path.join(dataRoot, "retrieval-demo");
const git = (dir: string, args: string[]) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
const fileHash = async (file: string) => sha(await readFile(file));
const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
export type DemoState = {
    id: string;
    phase: "prepared" | "measuring" | "repairing" | "checking" | "awaiting_review" | "goal_reached" | "needs_input" | "bounded_stop";
    reason: string;
    createdAt: string;
    updatedAt: string;
    baseCommit: string;
    historicalCommit: string;
    baselineRoot: string;
    currentRoot: string;
    epoch: number;
    datasetHash: string;
    sourceHash?: string;
    heldoutHash: string;
    contractHash: string;
    attempts: number;
    baseline?: string;
    candidate?: string;
    heldoutBaseline?: string;
    heldoutCandidate?: string;
    pending?: {
        root: string;
        changedFiles: string[];
        treeHash: string;
        decisionFile: string;
    };
    events: Array<{
        at: string;
        message: string;
    }>;
};
function directory(id: string) { if (!idPattern.test(id))
    throw new Error("Use a lowercase run ID with letters, digits, and hyphens."); return path.join(root, id); }
const stateFile = (id: string) => path.join(directory(id), "state.json");
export async function demoState(id?: string) { const active = id || ((await optionalJson<{
    id: string;
}>(path.join(root, "active.json")))?.id); return active ? optionalJson<DemoState>(stateFile(active)) : undefined; }
async function save(s: DemoState, message?: string) { s.updatedAt = new Date().toISOString(); if (message)
    s.events.push({ at: s.updatedAt, message }); await atomicJson(stateFile(s.id), s); await atomicJson(path.join(root, "active.json"), { id: s.id }); return s; }
async function required(id: string) { const s = await demoState(id); if (!s)
    throw new Error("Prepare this demo run first."); return s; }
async function fingerprint(dir: string) { const names = git(dir, ["ls-files", "-c", "-o", "--exclude-standard"]).split("\n").filter(Boolean); return Object.fromEntries(await Promise.all([...new Set(names)].sort().map(async (n) => [n, await fileHash(path.join(dir, n)).catch(e => { if ((e as NodeJS.ErrnoException).code === "ENOENT")
        return "missing"; throw e; })]))); }
async function locked<T>(id: string, operation: () => Promise<T>) { const file = path.join(directory(id), "controller.lock"); const handle = await open(file, "wx", 0o600).catch(() => { throw new Error("Another controller owns this run. Resolve that process before retrying."); }); try {
    await handle.writeFile(JSON.stringify({ pid: process.pid }));
    return await operation();
}
finally {
    await handle.close();
    await unlink(file);
} }
async function worktree(commit: string, tag: string) { const dir = path.join(productRoot, ".worktrees", tag); await mkdir(path.dirname(dir), { recursive: true }); git(productRoot, ["worktree", "add", "--detach", dir, commit]); await symlink(path.join(productRoot, "node_modules"), path.join(dir, "node_modules"), "dir"); return dir; }
async function copyProduct(from: string, to: string) { const names = git(from, ["ls-files", "-c", "-o", "--exclude-standard"]).split("\n").filter(allowedDemoFile); for (const f of [...new Set(names)]) {
    await mkdir(path.dirname(path.join(to, f)), { recursive: true });
    await copyFile(path.join(from, f), path.join(to, f));
} }
async function productHash(dir: string) { return sha(await Promise.all(["src/lib/ai/help-chat.ts", "src/lib/help-chat-config.ts", "src/lib/knowledge-repository.ts"].map(async (f) => [f, await fileHash(path.join(dir, f))]))); }
async function trusted(s: DemoState) {
    const files = (await readdir(path.join(labRoot, "demo"))).filter(f => /\.(ts|json)$/.test(f));
    return sha({ files: await Promise.all(files.sort().map(async (f) => [f, await fileHash(path.join(labRoot, "demo", f))])), dataset: await fileHash(path.join(directory(s.id), "development.json")), heldout: await fileHash(path.join(directory(s.id), "heldout.json")) });
}
export async function prepareDemo(id: string) {
    const dir = directory(id);
    if (await optionalJson(stateFile(id)))
        throw new Error("This run already exists. Use a new ID to reproduce from the frozen starting state.");
    if (!process.env.RELAYDESK_MODEL_BUDGET_FILE || Number(process.env.RELAYDESK_MODEL_BUDGET_USD) <= 0)
        throw new Error("Configure the shared persistent model budget before preparing the demo.");
    if (git(productRoot, ["status", "--porcelain"]))
        throw new Error("Commit the workshop implementation before preparing a reproducible run.");
    await mkdir(dir, { recursive: true });
    const baseCommit = git(productRoot, ["rev-parse", "HEAD"]);
    const historicalCommit = "53c2749887d4f3f9ba815acd105586bd25a67e05";
    const historic = git(productRoot, ["show", `${historicalCommit}:src/lib/help-chat-config.ts`]);
    if (!historic.includes('"RELAYDESK_HELP_INCLUDE_CONTEXT"') && !historic.includes('process.env.RELAYDESK_HELP_INCLUDE_CONTEXT,\n      false'))
        throw new Error("Historical provenance could not be verified.");
    const baselineRoot = await worktree(baseCommit, `rag-demo-${id}-baseline`);
    const file = path.join(baselineRoot, "src/lib/help-chat-config.ts");
    let source = await readFile(file, "utf8");
    const pattern = /(process\.env\.RELAYDESK_HELP_INCLUDE_CONTEXT,\s*)true/;
    if (!pattern.test(source))
        throw new Error("The expected healthy conversation default changed. Review the scenario before preparing it.");
    source = source.replace(pattern, "$1false");
    if(!source.includes("process.env.RELAYDESK_HELP_TOP_K, 5"))throw new Error("The expected retrieval depth changed. Review the historical scenario first.");
    source=source.replace("process.env.RELAYDESK_HELP_TOP_K, 5","process.env.RELAYDESK_HELP_TOP_K, 2");
    await writeFile(file, source);
    const dev = questionsSchema.parse(JSON.parse(await readFile(path.join(labRoot, "demo/development.json"), "utf8")));
    const heldout = questionsSchema.parse(JSON.parse(await readFile(path.join(labRoot, "demo/heldout.json"), "utf8")));
    if (dev.some(d => heldout.some(h => h.id === d.id || h.question === d.question)))
        throw new Error("Development and held-out questions overlap.");
    await atomicJson(path.join(dir, "development.json"), dev);
    await atomicJson(path.join(dir, "heldout.json"), heldout);
    const now = new Date().toISOString();
    const s: DemoState = { id, phase: "prepared", reason: "Historical missing follow-up context and two-chunk retrieval are restored only in the isolated scenario worktree. Answer quality is unscored.", createdAt: now, updatedAt: now, baseCommit, historicalCommit, baselineRoot, currentRoot: baselineRoot, epoch: 0, datasetHash: sha(dev), heldoutHash: sha(heldout), contractHash: sha(demoContract), attempts: 0, events: [] };
    await writeFile(path.join(dir, "baseline.patch"), execFileSync("git", ["-C", baselineRoot, "diff", "--", "src"], { encoding: "utf8" }));
    return save(s, "Prepared an isolated baseline. The shared spending ledger was preserved.");
}
async function measure(s: DemoState, product: string, split: "development" | "heldout", out: string, timeout: number, answers: boolean) {
    const output = path.join(directory(s.id), out);
    const dataset = path.join(directory(s.id), `${split}.json`);
    const before = await trusted(s);
    await runProcess(process.execPath, [path.join(productRoot, "node_modules/tsx/dist/cli.mjs"), "--tsconfig", path.join(product, "tsconfig.json"), path.join(labRoot, "demo/measure.ts"), "--product", product, "--dataset", dataset, "--split", split, "--out", output, "--cloud", ...(answers ? ["--answers"] : [])], { cwd: productRoot, outputFile: output + ".log", timeoutMs: timeout });
    if (before !== await trusted(s))
        throw new Error("Protected evaluation inputs changed while measuring.");
    const report = await optionalJson<RetrievalReport>(output);
    if (!report)
        throw new Error("Measurement produced no report.");
    if (!retrievalScore(report).complete)
        throw new Error("Measurement is incomplete.");
    return { file: output, report };
}
export async function runDemo(id: string, { answers = true } = {}) {
    return locked(id, async () => {
        let s = await required(id);
        if (s.phase === "awaiting_review")
            return save(s, "Skipped before measurement or model calls: a candidate still awaits engineer review.");
        if (s.phase === "goal_reached" && s.datasetHash === sha(JSON.parse(await readFile(path.join(directory(id), "development.json"), "utf8"))) && s.sourceHash === await productHash(s.currentRoot))
            return s;
        const start = Date.now(), deadline = start + demoContract.maxMinutes * 60000;
        const remaining = () => Math.max(1, deadline - Date.now());
        const epoch = s.epoch + 1;
        s = { ...s, epoch, attempts: 0, phase: "measuring" };
        try {
            await save(s, "Measuring a fresh development baseline.");
            const baseline = await measure(s, s.currentRoot, "development", `epoch-${epoch}-baseline.json`, remaining(), answers);
            s.baseline = baseline.file;
            s.datasetHash = baseline.report.manifest.datasetHash;
            s.sourceHash = baseline.report.manifest.productHash;
            if (retrievalScore(baseline.report).goalReached) {
                s.phase = "goal_reached";
                s.reason = "Every active question retrieved its expected approved source first in all three runs. Answer quality remains unscored.";
                return save(s, s.reason);
            }
            const failure = selectedRetrievalFailure(baseline.report)!;
            const protectedHash = await trusted(s);
            const skill = await readFile(path.join(productRoot, ".agents/skills/repair-rag/SKILL.md"), "utf8");
            const reviewedSteering = await readFile(path.join(labRoot,"feedback.md"),"utf8");
            const rejected: unknown[] = [];
            for (let attempt = 1; attempt <= demoContract.maxCandidates && Date.now() < deadline; attempt++) {
                s.attempts = attempt;
                s.phase = "repairing";
                await save(s, `Attempt ${attempt}: investigate ${failure.id}, ${failure.family}.`);
                const candidate = await worktree(s.baseCommit, `rag-demo-${id}-e${epoch}-a${attempt}`);
                await copyProduct(s.currentRoot, candidate);
                // Hold-out questions are not included in the repair prompt or its candidate checkout.
                for (const f of ["development.json", "heldout.json", "new-question.json"]) {
                    await unlink(path.join(candidate, "evaluations/rag-lab/demo", f));
                }
                const before = await fingerprint(candidate);
                const prompt = [
                    skill,
                    "This is a retrieval-ranking repair. Answer quality remains unscored.",
                    "Goal: expected approved source ranks first for every development question, with no regression.",
                    "Current development evidence:\n" + JSON.stringify(baseline.report.cases, null, 2),
                    `Selected failure family: ${failure.family}. Investigate the query sent to retrieval, including earlier user turns. Change one shared cause.`,
                    "Do not read held-out datasets, source repository history, other worktrees, environment files, or private data. Do not restore files deleted before your run.",
                    "Do not hardcode case IDs, questions, or source IDs. Allowed files: src/lib/ai/help-chat.ts, src/lib/help-chat-config.ts, src/lib/knowledge-repository.ts. New focused tests may go in tests/rag-repairs/.",
                    "Model IDs, approved-source filters, sources, grading code, datasets, dependencies, and other product behavior are protected.",
                    "Reviewed implementation guidance:\n" + reviewedSteering,
                    "Rejected attempts:\n" + JSON.stringify(rejected),
                    "Leave a small uncommitted patch. No deploy, merge, external messages, or additional agents."
                ].join("\n\n");
                const actorFile = path.join(directory(id), `epoch-${epoch}-actor-${attempt}.jsonl`);
                await runProcess("codex", ["exec", "--json", "--ephemeral", "--sandbox", "workspace-write", "-C", candidate, "-"], { cwd: candidate, outputFile: actorFile, timeoutMs: Math.min(180000, remaining()), input: prompt, actor: true });
                if (protectedHash !== await trusted(s))
                    throw new Error("The external evaluation inputs changed during repair.");
                const after = await fingerprint(candidate), files = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(f => before[f] !== after[f]);
                if (!files.length || files.some(f => !allowedDemoFile(f))) {
                    rejected.push({ attempt, reason: "No patch or changes outside the permitted product files." });
                    continue;
                }
                let changedLines = 0;
                for (const f of files) {
                    if (!(f in before)) {
                        changedLines += (await readFile(path.join(candidate, f), "utf8")).split("\n").length;
                        continue;
                    }
                    let diff = "";
                    try {
                        diff = execFileSync("git", ["diff", "--no-index", "--numstat", "--", path.join(s.currentRoot, f), path.join(candidate, f)], { encoding: "utf8" });
                    }
                    catch (e) {
                        const x = e as {
                            status?: number;
                            stdout?: string;
                        };
                        if (x.status !== 1)
                            throw e;
                        diff = x.stdout || "";
                    }
                    for (const line of diff.trim().split("\n").filter(Boolean)) {
                        const [a, b] = line.split("\t");
                        changedLines += Number.isFinite(Number(a)) && Number.isFinite(Number(b)) ? Number(a) + Number(b) : Infinity;
                    }
                }
                if (changedLines > demoContract.maxChangedLines) {
                    rejected.push({ attempt, reason: "The patch exceeds the fixed changed-line limit." });
                    continue;
                }
                const treeHash = sha(after);
                s.phase = "checking";
                await save(s, "Checking the candidate scope and product regression tests.");
                try {
                    await runProcess(path.join(productRoot, "node_modules/.bin/vitest"), ["run"], { cwd: candidate, outputFile: path.join(directory(id), `epoch-${epoch}-tests-${attempt}.log`), timeoutMs: remaining() });
                }
                catch (e) {
                    rejected.push({ attempt, reason: String(e) });
                    continue;
                }
                const measured = await measure(s, candidate, "development", `epoch-${epoch}-candidate-${attempt}.json`, remaining(), answers);
                const decision = retrievalDecision(baseline.report, measured.report);
                if (!decision.keep) {
                    rejected.push({ attempt, decision });
                    await atomicJson(path.join(directory(id), "rejections.json"), rejected);
                    continue;
                }
                // The patch is frozen before either held-out comparison is generated.
                const heldBaseline = await measure(s, s.currentRoot, "heldout", `epoch-${epoch}-heldout-baseline-${attempt}.json`, remaining(), answers);
                const heldCandidate = await measure(s, candidate, "heldout", `epoch-${epoch}-heldout-candidate-${attempt}.json`, remaining(), answers);
                s.candidate = measured.file;
                s.heldoutBaseline = heldBaseline.file;
                s.heldoutCandidate = heldCandidate.file;
                const heldDecision = retrievalDecision(heldBaseline.report, heldCandidate.report, { requireImprovement: false });
                if (!heldDecision.keep) {
                    rejected.push({ attempt, heldout: "Final generalization check failed. Do not tune against these questions; start a new run with a fresh held-out set." });
                    s.phase = "needs_input";
                    s.reason = "The held-out check failed. Review the result and supply a new untouched set before further tuning.";
                    await atomicJson(path.join(directory(id), "rejections.json"), rejected);
                    return save(s, s.reason);
                }
                if (treeHash !== sha(await fingerprint(candidate)))
                    throw new Error("The candidate changed after it was frozen.");
                const decisionFile = path.join(directory(id), `epoch-${epoch}-decision-${attempt}.json`);
                await atomicJson(decisionFile, { development: decision, heldout: heldDecision, answerQuality: "unscored", humanApproval: false });
                const patches = [];
                for (const f of files) {
                    try {
                        patches.push(execFileSync("git", ["diff", "--no-index", "--", path.join(s.currentRoot, f), path.join(candidate, f)], { encoding: "utf8" }));
                    }
                    catch (e) {
                        const x = e as {
                            status?: number;
                            stdout?: string;
                        };
                        if (x.status !== 1)
                            throw e;
                        patches.push(x.stdout || "");
                    }
                }
                await writeFile(path.join(directory(id), `epoch-${epoch}-candidate-${attempt}.patch`), patches.join("\n"));
                s = { ...s, phase: "awaiting_review", candidate: measured.file, heldoutBaseline: heldBaseline.file, heldoutCandidate: heldCandidate.file, pending: { root: candidate, changedFiles: files, treeHash, decisionFile }, reason: "The retrieval score improved and the held-out regression check passed. The patch awaits engineer review. Answer quality remains unscored." };
                return save(s, s.reason);
            }
            s.phase = "bounded_stop";
            s.reason = "The active run reached its candidate or time limit. Review the recorded evidence.";
            await atomicJson(path.join(directory(id), "rejections.json"), rejected);
            return save(s, s.reason);
        }
        catch (e) {
            s.phase = "needs_input";
            s.reason = e instanceof Error ? e.message : String(e);
            return save(s, s.reason);
        }
    });
}
export async function addDemoQuestion(id: string, file: string) { return locked(id, async () => { const s = await required(id); const task = questionSchema.parse(JSON.parse(await readFile(path.resolve(file), "utf8"))); const f = path.join(directory(id), "development.json"), tasks = questionsSchema.parse(JSON.parse(await readFile(f, "utf8"))); if (tasks.some(t => t.id === task.id))
    throw new Error("This question was already added."); tasks.push(task); questionsSchema.parse(tasks); await atomicJson(f, tasks); return save(s, `Added ${task.id}. Existing review state is preserved; the next permitted measurement establishes a new dataset version.`); }); }
export async function reviewDemo(id: string, accept: boolean) { return locked(id, async () => { const s = await required(id); if (s.phase !== "awaiting_review" || !s.pending)
    throw new Error("No candidate awaits review."); if (sha(await fingerprint(s.pending.root)) !== s.pending.treeHash)
    throw new Error("The candidate changed after measurement. Re-measure before review."); await atomicJson(path.join(directory(id), `epoch-${s.epoch}-human-decision.json`), { accepted: accept, at: new Date().toISOString(), scope: "Local retrieval patch. No release or semantic-quality approval." }); if (accept)
    s.currentRoot = s.pending.root; delete s.pending; s.phase = "prepared"; s.reason = accept ? "The engineer accepted the local candidate. The next run remeasures all active questions." : "The engineer rejected the candidate. Review guidance before another run."; return save(s, s.reason); }); }
export async function demoView() { const state = await demoState(); if (!state)
    return { state: null }; const read = async (f?: string) => f ? optionalJson<RetrievalReport>(f) : undefined; const patchFile = path.join(directory(state.id), `epoch-${state.epoch}-candidate-${state.attempts}.patch`); let patch = ""; try {
    patch = await readFile(patchFile, "utf8");
}
catch { } return { state, patch, contract: demoContract, baseline: await read(state.baseline), candidate: await read(state.candidate), heldoutBaseline: await read(state.heldoutBaseline), heldoutCandidate: await read(state.heldoutCandidate) }; }
export async function watchDemo(id: string) {
    let stopped = false;
    const stop = () => { stopped = true; };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    let last = "";
    console.info("Watching this demo's source and question set. Ctrl+C stops the watcher.");
    try {
        while (!stopped) {
            const s = await required(id);
            const sig = sha({ dataset: await fileHash(path.join(directory(id), "development.json")), source: await productHash(s.currentRoot), phase: s.phase });
            if (sig !== last) {
                last = sig;
                if (s.phase === "awaiting_review")
                    console.info("Waiting for engineer review. No model calls.");
                else if (s.phase === "prepared" || s.phase === "goal_reached") {
                    const next = await runDemo(id);
                    console.info(`${next.phase}: ${next.reason}`);
                }
            }
            await new Promise<void>(resolve => { const timer = setTimeout(resolve, 15000); if (stopped) {
                clearTimeout(timer);
                resolve();
            } });
        }
    }
    finally {
        process.removeListener("SIGINT", stop);
        process.removeListener("SIGTERM", stop);
    }
}


export async function saveDemoReview(input:unknown){
 const value=demoReviewSchema.parse(input);
 return locked(value.id,async()=>{const state=await required(value.id);
 const reports=await Promise.all([state.baseline,state.candidate].filter((f):f is string=>Boolean(f)).map(f=>optionalJson<RetrievalReport>(f)));
 const answer=reports.flatMap(r=>r?.cases.flatMap(c=>c.attempts.map(a=>a.answer))||[]).find(a=>a?.traceId===value.traceId);
 if(!answer)throw new Error("This answer is no longer in the current development comparison. Reload the page.");
 const row={...value,answerHash:sha(answer),at:new Date().toISOString(),scope:"Human review of a saved answer. This does not calibrate or enable the full quality judge."};
 await appendFile(path.join(directory(value.id),"answer-reviews.jsonl"),JSON.stringify(row)+"\n",{mode:0o600});return row;
 });
}
