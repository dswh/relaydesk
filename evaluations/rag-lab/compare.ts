import path from "node:path";
import { readFile } from "node:fs/promises";
import { atomicJson, dataRoot, labRoot, sha } from "./store";
import { requireValidatedJudge } from "./judge";

type Experiment = {
  name: string; hardOnly: boolean; repeats: number;
  manifest: { config: Record<string, unknown>; corpusHash: string; datasetHash: string; contractHash: string; judgeVersion: string | null };
  rows: Array<{ caseId: string; critical: boolean; error?: string | null; metrics: Array<{ key: string; score?: number | boolean | null }> }>;
};
const score = (row: Experiment["rows"][number]) => row.metrics.find(m => m.key === "task_success")?.score;
const hardPass = (row: Experiment["rows"][number]) => !row.error && row.metrics.filter(m => m.key !== "task_success").every(m => m.score === 1 || m.score === true);

export function compareExperiments(baseline: Experiment, candidate: Experiment, target: string, targetRate = 1) {
  const issues: string[] = [];
  for (const key of ["corpusHash", "datasetHash", "contractHash", "judgeVersion"] as const) if (!baseline.manifest[key] || baseline.manifest[key] !== candidate.manifest[key]) issues.push(`${key} changed or is missing.`);
  for (const key of ["modelProvider", "openrouterProviders", "embeddingMode", "embeddingModel", "generationModel"]) if (sha(baseline.manifest.config[key]??null) !== sha(candidate.manifest.config[key]??null)) issues.push(`${key} changed. Establish a new evaluation epoch.`);
  if (baseline.hardOnly || candidate.hardOnly) issues.push("Code checks alone do not establish semantic improvement.");
  if (baseline.repeats !== 3 || candidate.repeats !== 3) issues.push("This checkpoint requires three paired repeats.");
  const keyCounts = (e: Experiment) => Object.fromEntries([...new Set(e.rows.map(r => r.caseId))].sort().map(id => [id, e.rows.filter(r => r.caseId === id).length]));
  if (sha(keyCounts(baseline)) !== sha(keyCounts(candidate))) issues.push("The case coverage differs.");
  if (Object.values(keyCounts(candidate)).some(count => count !== 3)) issues.push("Every case must have all three repetitions.");
  if (candidate.rows.some(r => !hardPass(r))) issues.push("A candidate failed a code check or run.");
  if (candidate.rows.some(r => score(r) !== 0 && score(r) !== 1)) issues.push("A candidate is missing a binary task-success result.");
  const baselineTarget = baseline.rows.filter(r => r.caseId === target), candidateTarget = candidate.rows.filter(r => r.caseId === target);
  if (baselineTarget.length !== 3 || candidateTarget.length !== 3) issues.push("The target case must occur three times in both experiments.");
  const targetGain = candidateTarget.filter(r => score(r) === 1).length - baselineTarget.filter(r => score(r) === 1).length;
  if (targetGain <= 0) issues.push("The selected failure did not improve.");
  const regressions = [];
  for (const id of Object.keys(keyCounts(candidate))) {
    const a = baseline.rows.filter(r => r.caseId === id), b = candidate.rows.filter(r => r.caseId === id);
    if (b.filter(r => score(r) === 1).length < a.filter(r => score(r) === 1).length) regressions.push(id);
    if (b.some(r => r.critical && score(r) !== 1)) issues.push(`Protected case ${id} failed.`);
    if (new Set(b.map(score)).size > 1) issues.push(`Case ${id} varies across repeated runs. Investigate before acceptance.`);
  }
  if (regressions.length) issues.push(`Task regressions: ${regressions.join(", ")}.`);
  const taskSuccessRate = candidate.rows.length ? candidate.rows.filter(r => score(r) === 1).length / candidate.rows.length : 0;
  if (taskSuccessRate < targetRate) issues.push("The candidate is below the workshop task-success floor.");
  return { decision: issues.length ? "revert_or_investigate" : "review_candidate", baseline: baseline.name, candidate: candidate.name, target, targetGain, taskSuccessRate, regressions, issues, releaseAuthorized: false, next: issues.length ? "Restore the baseline or investigate one failure before the next candidate." : "Review the diff, cost, and latency. Run the separate sealed final product cases before authorizing release." };
}
export async function compareFiles(baselineName: string, candidateName: string, target: string) {
  const identity = await requireValidatedJudge();
  const [baseline, candidate] = await Promise.all([baselineName, candidateName].map(async name => JSON.parse(await readFile(path.resolve(name), "utf8")) as Experiment));
  if (candidate.manifest.judgeVersion !== identity.version) throw new Error("The experiment uses a different judge version from the validated current judge.");
  const contract = JSON.parse(await readFile(path.join(labRoot, "contract.json"), "utf8"));
  const result = compareExperiments(baseline, candidate, target, contract.productSuccessTarget);
  await atomicJson(path.join(dataRoot, "decisions", `${Date.now()}.json`), result);
  return result;
}
