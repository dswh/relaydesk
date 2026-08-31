type AssertionContext = {
  vars: Record<string, unknown>;
};

type HelpAnswer = {
  answer: string;
  citation: { articleId: string; url: string } | null;
};

function parse(output: string) {
  return JSON.parse(output) as HelpAnswer;
}

function result(pass: boolean, score: number, reason: string) {
  return { pass, reason, score };
}

export function answerCoverage(output: string, context: AssertionContext) {
  const { answer } = parse(output);
  const expectedConcepts = String(context.vars.expectedConcepts)
    .split(";")
    .map((concept) => concept.split("|").map((phrase) => phrase.trim().toLowerCase()));
  const normalized = answer.toLowerCase();
  const covered = expectedConcepts.filter((alternatives) =>
    alternatives.some((phrase) => normalized.includes(phrase)),
  );
  const score = covered.length / expectedConcepts.length;
  return result(score >= 0.9, score, `${covered.length} of ${expectedConcepts.length} answer concepts are covered.`);
}

export function citationCorrectness(output: string, context: AssertionContext) {
  const { citation } = parse(output);
  const expectedId = String(context.vars.expectedArticleId);
  const pass = citation?.articleId === expectedId && citation.url.startsWith("/help/");
  return result(pass, pass ? 1 : 0, pass ? `Cites ${expectedId}.` : `Expected ${expectedId}, received ${citation?.articleId ?? "no citation"}.`);
}

export function answerUsefulness(output: string) {
  const { answer } = parse(output);
  const words = answer.split(/\s+/).length;
  const pass = words >= 70 && words <= 260;
  return result(pass, pass ? 1 : 0, `The self-contained answer contains ${words} words.`);
}
