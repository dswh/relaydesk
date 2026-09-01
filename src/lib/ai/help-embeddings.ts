import { createHash } from "node:crypto";

import { embed, embedMany } from "ai";

import {
  HELP_FIXTURE_EMBEDDING_MODEL,
  type HelpChatConfig,
} from "@/lib/help-chat-config";

const DIMENSIONS = 384;

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "can",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "or",
  "our",
  "should",
  "that",
  "the",
  "their",
  "this",
  "to",
  "we",
  "what",
  "when",
  "which",
  "who",
  "why",
  "with",
]);

const canonicalTerms: Record<string, string> = {
  bill: "usage",
  billing: "usage",
  broken: "pending",
  calendar: "date",
  collections: "knowledge",
  compliance: "policy",
  csv: "export",
  deduplicate: "dedupe",
  deduplication: "dedupe",
  deleted: "missing",
  delivery: "webhook",
  dns: "dns",
  events: "event",
  identity: "sso",
  idempotency: "dedupe",
  idempotent: "dedupe",
  ids: "identifier",
  invitation: "invite",
  invitations: "invite",
  legal: "policy",
  link: "invite",
  lost: "missing",
  month: "date",
  ownership: "verify",
  permissions: "access",
  record: "dns",
  restricted: "restrict",
  retries: "retry",
  sources: "knowledge",
  stuck: "pending",
  team: "queue",
  text: "txt",
  verification: "verify",
  verified: "verify",
  verifying: "verify",
  webhooks: "webhook",
};

function tokens(value: string) {
  return value
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => !stopWords.has(token))
    .map((token) => canonicalTerms[token] ?? token) ?? [];
}

function fixtureEmbedding(value: string) {
  const vector = Array<number>(DIMENSIONS).fill(0);
  const normalized = tokens(value);
  const features = [
    ...normalized,
    ...normalized.slice(0, -1).map((token, index) => `${token}_${normalized[index + 1]}`),
  ];

  for (const feature of features) {
    const digest = createHash("sha256").update(feature).digest();
    const index = digest.readUInt32BE(0) % DIMENSIONS;
    const sign = digest[4]! % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, component) => sum + component ** 2, 0));
  return magnitude === 0 ? vector : vector.map((component) => component / magnitude);
}

export async function createHelpEmbedding(value: string, config: HelpChatConfig) {
  if (config.embeddingMode === "fixture") {
    return {
      model: HELP_FIXTURE_EMBEDDING_MODEL,
      vector: fixtureEmbedding(value),
    };
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for gateway embeddings.");
  }

  const result = await embed({ model: config.embeddingModel, value });
  return { model: config.embeddingModel, vector: result.embedding };
}

export async function createHelpEmbeddings(values: string[], config: HelpChatConfig) {
  if (config.embeddingMode === "fixture") {
    return {
      model: HELP_FIXTURE_EMBEDDING_MODEL,
      vectors: values.map(fixtureEmbedding),
    };
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for gateway embeddings.");
  }

  const result = await embedMany({ model: config.embeddingModel, values });
  return { model: config.embeddingModel, vectors: result.embeddings };
}

export function vectorLiteral(vector: number[]) {
  return `[${vector.map((component) => component.toFixed(10)).join(",")}]`;
}
