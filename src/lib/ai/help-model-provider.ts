import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { getHelpChatConfig, type HelpChatConfig } from "../help-chat-config";
import { budgetedOpenRouterFetch } from "./help-model-budget";

export function hasHelpModelKey(config = getHelpChatConfig()) {
  return Boolean(config.modelProvider === "openrouter" ? process.env.OPENROUTER_API_KEY?.trim() : process.env.AI_GATEWAY_API_KEY?.trim());
}

export function requireHelpModelKey(config = getHelpChatConfig()) {
  if (!hasHelpModelKey(config)) throw new Error(`${config.modelProvider === "openrouter" ? "OPENROUTER_API_KEY" : "AI_GATEWAY_API_KEY"} is required for live help models.`);
}

function router(config: HelpChatConfig) {
  requireHelpModelKey(config);
  if (!config.openrouterProviders.length) throw new Error("Set RELAYDESK_OPENROUTER_PROVIDERS to the provider slug used for this evaluation epoch.");
  return createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY, compatibility:"strict", fetch:budgetedOpenRouterFetch });
}

export function helpLanguageModel(model: string, config = getHelpChatConfig()) {
  requireHelpModelKey(config);
  if (config.modelProvider === "gateway") return model;
  return router(config).chat(model, { provider: { order: config.openrouterProviders, allow_fallbacks: false, require_parameters: true } });
}

export function helpEmbeddingModel(model: string, config = getHelpChatConfig()) {
  requireHelpModelKey(config);
  if (config.modelProvider === "gateway") return model;
  return router(config).textEmbeddingModel(model, { provider: { order: config.openrouterProviders, allow_fallbacks: false, require_parameters: true } });
}
