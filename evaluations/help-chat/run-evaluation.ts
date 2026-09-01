import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

import { config as loadEnvironment } from "dotenv";

import { generateHelpChatAnswer, type HelpChatAnswer } from "../../src/lib/ai/help-chat";
import { closeDatabase } from "../../src/lib/db";
import { evaluateDeterministicGates, type GateResult } from "./assertions";
import { loadHelpChatDataset, type HelpChatEvalCase } from "./dataset";
import { judgeHelpAnswer, type JudgeScores } from "./judge-rubric";

loadEnvironment({ path: ".env.local", quiet: true });

const targets = {
  clarity: 4.3,
  completeness: 4.3,
  correctness: 4.5,
  deterministicPassRate: 1,
  groundedness: 4.7,
  mrr: 0.85,
  noSourceAccuracy: 1,
  relevance: 4.5,
  sourceRecallAtFive: 0.93,
};

type CaseRun = {
  answer: HelpChatAnswer;
  durationMs: number;
  evalCase: HelpChatEvalCase;
  gates: GateResult[];
  judge: JudgeScores;
  mrr: number | null;
  recallAtFive: number | null;
  repeat: number;
};

type MetricRow = {
  current: number;
  metric: string;
  pass: boolean;
  target: number;
};

type EvaluationSummary = {
  cases: Array<{
    actualOutput: string;
    actualSources: string[];
    caseId: string;
    category: string;
    clarity: number;
    completeness: number;
    correctness: number;
    deterministicPass: boolean;
    durationMs: number;
    expectedAnswer: string;
    expectedSources: string[];
    groundedness: number;
    judgeReason: string;
    mrr: number | null;
    notes: string;
    outcome: string;
    overallScore: number;
    question: string;
    recallAtFive: number | null;
    relevance: number;
    repeat: number;
  }>;
  completedAt: string;
  configuration: {
    generationModels: string[];
    judgeModels: string[];
    mode: string;
    repeats: number;
  };
  metrics: MetricRow[];
  passed: boolean;
  tokenUsage: { input: number; output: number };
};

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function retrievalMetrics(evalCase: HelpChatEvalCase, answer: HelpChatAnswer) {
  if (evalCase.expectedSources.length === 0) {
    return { mrr: null, recallAtFive: null };
  }
  const retrieved = answer.retrieved.slice(0, 5).map((chunk) => chunk.sourceId);
  const rank = retrieved.findIndex((source) => evalCase.expectedSources.includes(source));
  return {
    mrr: rank < 0 ? 0 : 1 / (rank + 1),
    recallAtFive: rank < 0 ? 0 : 1,
  };
}

function averageJudge(cases: CaseRun[], dimension: keyof Pick<JudgeScores, "clarity" | "completeness" | "correctness" | "groundedness" | "relevance">) {
  return mean(cases.map((item) => item.judge[dimension]));
}

function metric(metric: string, current: number, target: number): MetricRow {
  return { current, metric, pass: current >= target, target };
}

function metricAtMost(metricName: string, current: number, target: number): MetricRow {
  return { current, metric: metricName, pass: current <= target, target };
}

function summarize(cases: CaseRun[], mode: string, repeats: number): EvaluationSummary {
  const retrievalCases = cases.filter((item) => item.recallAtFive !== null);
  const noSourceCases = cases.filter((item) => item.evalCase.expectedSources.length === 0);
  const noSourceAccuracy = mean(
    noSourceCases.map((item) =>
      item.answer.outcome === item.evalCase.expectedOutcome ? 1 : 0,
    ),
  );
  const deterministicPassRate = mean(
    cases.map((item) => (item.gates.every((gate) => gate.pass) ? 1 : 0)),
  );
  const metrics = [
    metric(
      "Source recall@5",
      mean(retrievalCases.map((item) => item.recallAtFive ?? 0)),
      targets.sourceRecallAtFive,
    ),
    metric("MRR", mean(retrievalCases.map((item) => item.mrr ?? 0)), targets.mrr),
    metric("No-source accuracy", noSourceAccuracy, targets.noSourceAccuracy),
    metric("Deterministic pass rate", deterministicPassRate, targets.deterministicPassRate),
    metric("Judge correctness", averageJudge(cases, "correctness"), targets.correctness),
    metric("Judge groundedness", averageJudge(cases, "groundedness"), targets.groundedness),
    metric("Judge completeness", averageJudge(cases, "completeness"), targets.completeness),
    metric("Judge relevance", averageJudge(cases, "relevance"), targets.relevance),
    metric("Judge clarity", averageJudge(cases, "clarity"), targets.clarity),
  ];

  const varianceByCase = new Map<string, Record<string, number[]>>();
  for (const item of cases) {
    const dimensions = varianceByCase.get(item.evalCase.caseId) ?? {};
    for (const key of ["correctness", "groundedness", "completeness", "relevance", "clarity"] as const) {
      dimensions[key] = [...(dimensions[key] ?? []), item.judge[key]];
    }
    varianceByCase.set(item.evalCase.caseId, dimensions);
  }
  const maximumJudgeDeviation = Math.max(
    0,
    ...[...varianceByCase.values()].flatMap((dimensions) =>
      Object.values(dimensions).map(standardDeviation),
    ),
  );
  metrics.push(metricAtMost("Judge max standard deviation", maximumJudgeDeviation, 0.5));

  return {
    cases: cases.map((item) => {
      const failed = item.gates.filter((gate) => !gate.pass);
      const overallScore = mean([
        item.judge.correctness,
        item.judge.groundedness,
        item.judge.completeness,
        item.judge.relevance,
        item.judge.clarity,
      ]);
      return {
        actualOutput: item.answer.answer,
        actualSources: item.answer.citations.map((citation) => citation.sourceId),
        caseId: item.evalCase.caseId,
        category: item.evalCase.category,
        clarity: item.judge.clarity,
        completeness: item.judge.completeness,
        correctness: item.judge.correctness,
        deterministicPass: failed.length === 0,
        durationMs: item.durationMs,
        expectedAnswer: item.evalCase.referenceAnswer,
        expectedSources: item.evalCase.expectedSources,
        groundedness: item.judge.groundedness,
        judgeReason: item.judge.reason,
        mrr: item.mrr,
        notes: failed.length ? failed.map((gate) => gate.name).join(", ") : "All deterministic gates passed.",
        outcome: item.answer.outcome,
        overallScore,
        question: item.evalCase.followUp
          ? `${item.evalCase.question} Follow-up: ${item.evalCase.followUp}`
          : item.evalCase.question,
        recallAtFive: item.recallAtFive,
        relevance: item.judge.relevance,
        repeat: item.repeat,
      };
    }),
    completedAt: new Date().toISOString(),
    configuration: {
      generationModels: [...new Set(cases.map((item) => item.answer.model))],
      judgeModels: [...new Set(cases.map((item) => item.judge.model))],
      mode,
      repeats,
    },
    metrics,
    passed: metrics.every((item) => item.pass),
    tokenUsage: {
      input: cases.reduce((sum, item) => sum + item.judge.inputTokens, 0),
      output: cases.reduce((sum, item) => sum + item.judge.outputTokens, 0),
    },
  };
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function resultsCsv(summary: EvaluationSummary) {
  const headers = [
    "Case ID",
    "Question",
    "Expected Answer",
    "Actual Output",
    "Expected Sources",
    "Actual Sources",
    "Recall@5",
    "MRR",
    "Deterministic Pass",
    "Correctness",
    "Groundedness",
    "Completeness",
    "Relevance",
    "Clarity",
    "Overall Score",
    "Notes",
  ];
  const rows = summary.cases.map((item) => [
    item.caseId,
    item.question,
    item.expectedAnswer,
    item.actualOutput,
    item.expectedSources,
    item.actualSources,
    item.recallAtFive,
    item.mrr,
    item.deterministicPass,
    item.correctness,
    item.groundedness,
    item.completeness,
    item.relevance,
    item.clarity,
    item.overallScore,
    item.notes,
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function summaryCsv(summary: EvaluationSummary) {
  return [
    ["Metric", "Current", "Target", "Status"],
    ...summary.metrics.map((item) => [
      item.metric,
      item.current,
      item.target,
      item.pass ? "PASS" : "FAIL",
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}

function printSummary(summary: EvaluationSummary) {
  console.table(
    summary.metrics.map((item) => ({
      Current: item.current.toFixed(3),
      Metric: item.metric,
      Status: item.pass ? "PASS" : "FAIL",
      Target: item.target.toFixed(3),
    })),
  );
  console.info(
    `${summary.passed ? "PASS" : "FAIL"}: ${summary.cases.length} case runs, ${summary.configuration.repeats} repeat(s), ${summary.configuration.mode} mode.`,
  );
}

async function latestSummary() {
  const runsDirectory = path.join(process.cwd(), "evaluations", "help-chat", "runs");
  const entries = (await readdir(runsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  const latest = entries[0];
  if (!latest) throw new Error("No help-chat evaluation run exists yet.");
  return JSON.parse(
    await readFile(path.join(runsDirectory, latest, "summary.json"), "utf8"),
  ) as EvaluationSummary;
}

async function evaluate() {
  const reportOnly = process.argv.includes("--report-only");
  if (reportOnly) {
    printSummary(await latestSummary());
    return;
  }

  const mode = process.env.RELAYDESK_HELP_EVAL_MODE === "live" ? "live" : "deterministic";
  const live = mode === "live";
  if (live && !process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for the live help-chat evaluation.");
  }
  const repeats = live
    ? Math.max(1, Number(process.env.RELAYDESK_HELP_EVAL_REPEATS ?? 3))
    : 1;
  const filterArgument = process.argv.find((argument) => argument.startsWith("--case="));
  const caseFilter = filterArgument?.split("=")[1];
  const dataset = (await loadHelpChatDataset()).filter(
    (item) => !caseFilter || item.caseId === caseFilter,
  );
  if (dataset.length === 0) throw new Error(`No evaluation case matched ${caseFilter}.`);

  const caseRuns: CaseRun[] = [];
  for (let repeat = 1; repeat <= repeats; repeat += 1) {
    for (const evalCase of dataset) {
      const messages = [
        { content: evalCase.question, role: "user" as const },
        ...(evalCase.followUp
          ? [{ content: evalCase.followUp, role: "user" as const }]
          : []),
      ];
      const started = performance.now();
      const answer = await generateHelpChatAnswer(messages, { live });
      const durationMs = Math.round(performance.now() - started);
      const gates = evaluateDeterministicGates(answer, evalCase);
      const judge = await judgeHelpAnswer(evalCase, answer, { live });
      caseRuns.push({
        answer,
        durationMs,
        evalCase,
        gates,
        judge,
        ...retrievalMetrics(evalCase, answer),
        repeat,
      });
      const failed = gates.filter((gate) => !gate.pass).map((gate) => gate.name);
      console.info(
        `${evalCase.caseId} repeat ${repeat}: ${failed.length ? `FAIL ${failed.join(", ")}` : "PASS"}`,
      );
    }
  }

  const summary = summarize(caseRuns, mode, repeats);
  const runId = summary.completedAt.replace(/[:.]/g, "-");
  const runDirectory = path.join(
    process.cwd(),
    "evaluations",
    "help-chat",
    "runs",
    runId,
  );
  await mkdir(runDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(runDirectory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`),
    writeFile(path.join(runDirectory, "evaluation-results.csv"), `${resultsCsv(summary)}\n`),
    writeFile(path.join(runDirectory, "score-summary.csv"), `${summaryCsv(summary)}\n`),
  ]);
  printSummary(summary);
  console.info(`Report: ${path.relative(process.cwd(), runDirectory)}`);
  if (!summary.passed) process.exitCode = 1;
}

try {
  await evaluate();
} finally {
  await closeDatabase();
}
