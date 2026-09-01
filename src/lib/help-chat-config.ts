export const HELP_FIXTURE_EMBEDDING_MODEL = "relaydesk/hash-embedding-v1-384";
export const DEFAULT_HELP_GENERATION_MODEL = "anthropic/claude-sonnet-5";
export const DEFAULT_HELP_JUDGE_MODEL = "anthropic/claude-sonnet-5";

export type HelpChatConfig = {
  clarifyAmbiguous: boolean;
  contextBudgetCharacters: number;
  embeddingMode: "fixture" | "gateway";
  embeddingModel: string;
  generationModel: string;
  includeConversationContext: boolean;
  lexicalWeight: number;
  minimumEvidenceScore: number;
  requireCitations: boolean;
  safePromptHandling: boolean;
  strictEvidence: boolean;
  topK: number;
  vectorWeight: number;
};

function booleanValue(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function numberValue(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getHelpChatConfig(): HelpChatConfig {
  const embeddingMode =
    process.env.RELAYDESK_HELP_EMBEDDING_MODE === "gateway"
      ? "gateway"
      : "fixture";

  return {
    clarifyAmbiguous: booleanValue(
      process.env.RELAYDESK_HELP_CLARIFY_AMBIGUOUS,
      true,
    ),
    contextBudgetCharacters: numberValue(
      process.env.RELAYDESK_HELP_CONTEXT_BUDGET,
      7_000,
    ),
    embeddingMode,
    embeddingModel:
      embeddingMode === "gateway"
        ? process.env.RELAYDESK_HELP_EMBEDDING_MODEL ??
          "openai/text-embedding-3-small"
        : HELP_FIXTURE_EMBEDDING_MODEL,
    generationModel:
      process.env.RELAYDESK_HELP_GENERATION_MODEL ??
      DEFAULT_HELP_GENERATION_MODEL,
    includeConversationContext: booleanValue(
      process.env.RELAYDESK_HELP_INCLUDE_CONTEXT,
      true,
    ),
    lexicalWeight: numberValue(
      process.env.RELAYDESK_HELP_LEXICAL_WEIGHT,
      0.3,
    ),
    minimumEvidenceScore: numberValue(
      process.env.RELAYDESK_HELP_MINIMUM_EVIDENCE,
      0.1,
    ),
    requireCitations: booleanValue(
      process.env.RELAYDESK_HELP_REQUIRE_CITATIONS,
      true,
    ),
    safePromptHandling: booleanValue(
      process.env.RELAYDESK_HELP_SAFE_PROMPT_HANDLING,
      true,
    ),
    strictEvidence: booleanValue(
      process.env.RELAYDESK_HELP_STRICT_EVIDENCE,
      true,
    ),
    topK: Math.max(1, Math.round(numberValue(process.env.RELAYDESK_HELP_TOP_K, 5))),
    vectorWeight: numberValue(
      process.env.RELAYDESK_HELP_VECTOR_WEIGHT,
      0.7,
    ),
  };
}
