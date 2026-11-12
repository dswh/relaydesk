import type { Check } from "./store";

export type ScoredAttempt = {
  repeat: number;
  checks: Check[];
  semantic?: { verdict: "pass" | "fail"; critique: string };
  answer: string;
  durationMs: number;
  evidence?: Array<{ sourceId: string; heading: string; content: string }>;
  traceId?: string;
};
export type ScoredCase = {
  caseId: string;
  question: string;
  critical: boolean;
  attempts: ScoredAttempt[];
};
export type Scorecard = ReturnType<typeof makeScorecard>;

export function makeScorecard(cases: ScoredCase[], mode: "live" | "fixture") {
  const rows = cases.map(c => {
    const scored = c.attempts.length === 3 && c.attempts.every(a => a.semantic);
    const passed = scored && c.attempts.every(a => a.checks.every(g => g.pass) && a.semantic?.verdict === "pass");
    const labels = [...new Set(c.attempts.flatMap(a => [
      ...a.checks.filter(g => !g.pass).map(g => g.key),
      ...(a.semantic?.verdict === "fail" ? ["task_failure"] : []),
      ...(!a.semantic ? ["semantic_unscored"] : []),
    ]))];
    return { ...c, verdict: passed ? "pass" as const : scored ? "fail" as const : "unscored" as const, labels };
  });
  const passedQuestions = rows.filter(c => c.verdict === "pass").length;
  const criticalFailures = rows.filter(c => c.critical && c.verdict === "fail").length;
  const criticalUnscored = rows.filter(c => c.critical && c.verdict === "unscored").length;
  const allScored = rows.length > 0 && rows.every(c => c.verdict !== "unscored");
  return { mode, totalQuestions: rows.length, passedQuestions, criticalFailures, criticalUnscored,
    totalScore: allScored ? 100 * passedQuestions / rows.length : null,
    goalReached: mode === "live" && allScored && passedQuestions === rows.length && criticalFailures === 0,
    cases: rows,
  };
}

export function selectFailure(scorecard: Scorecard) {
  return [...scorecard.cases].filter(c => c.verdict !== "pass").sort((a,b) =>
    Number(b.critical) - Number(a.critical) ||
    b.attempts.filter(x => x.semantic?.verdict === "fail").length - a.attempts.filter(x => x.semantic?.verdict === "fail").length ||
    a.caseId.localeCompare(b.caseId),
  )[0];
}

export function candidateDecision(baseline: Scorecard, candidate: Scorecard, target: string) {
  const issues: string[] = [];
  const a = new Map(baseline.cases.map(c => [c.caseId, c]));
  const b = new Map(candidate.cases.map(c => [c.caseId, c]));
  if (baseline.mode !== "live" || candidate.mode !== "live") issues.push("Fixture scores cannot accept a quality change.");
  if (a.size !== b.size || [...a.keys()].some(k => !b.has(k))) issues.push("Case coverage changed during the candidate.");
  if (candidate.cases.some(c => c.verdict === "unscored")) issues.push("A semantic verdict is missing.");
  for (const c of candidate.cases) {
    if (c.critical && c.verdict !== "pass" && a.get(c.caseId)?.verdict === "pass") issues.push(`New critical failure: ${c.caseId}.`);
    if (a.get(c.caseId)?.verdict === "pass" && c.verdict !== "pass") issues.push(`Regression: ${c.caseId}.`);
    for (const key of new Set(c.attempts.flatMap(x => x.checks.map(g => g.key)))) {
      const previous = a.get(c.caseId)?.attempts.filter(x => x.checks.some(g => g.key === key && !g.pass)).length ?? 0;
      const current = c.attempts.filter(x => x.checks.some(g => g.key === key && !g.pass)).length;
      if (current > previous) issues.push(`New code-check failures: ${c.caseId}, ${key}.`);
    }
    const outcomes = new Set(c.attempts.map(x => x.semantic?.verdict));
    const previousOutcomes = new Set(a.get(c.caseId)?.attempts.map(x => x.semantic?.verdict));
    if(c.attempts.filter(x=>x.semantic?.verdict==="fail").length>(a.get(c.caseId)?.attempts.filter(x=>x.semantic?.verdict==="fail").length??0))issues.push(`More failed repetitions: ${c.caseId}.`);
    if (outcomes.size > 1 && previousOutcomes.size <= 1) issues.push(`Newly unstable answer quality: ${c.caseId}.`);
    if (c.attempts.length !== 3) issues.push(`Three repeats required: ${c.caseId}.`);
  }
  if (!a.has(target) || !b.has(target)) issues.push("The selected target is missing.");
  else if (a.get(target)!.verdict === "pass" || b.get(target)!.verdict !== "pass") issues.push("The selected failure was not repaired.");
  if (candidate.passedQuestions <= baseline.passedQuestions) issues.push("The total number of passing questions did not increase.");
  return { keep: issues.length === 0, issues, goalReached: candidate.goalReached };
}
