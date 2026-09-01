import { config as loadEnvironment } from "dotenv";

import { generateHelpChatAnswer } from "../../src/lib/ai/help-chat";

loadEnvironment({ path: ".env.local", quiet: true });

type ProviderContext = {
  vars?: Record<string, unknown>;
};

export default class HelpChatProvider {
  id() {
    return "relaydesk:help-chat";
  }

  async callApi(_prompt: string, context?: ProviderContext) {
    const question = String(context?.vars?.question ?? "").trim();
    if (!question) return { error: "A help-chat question is required." };
    const followUp = String(context?.vars?.followUp ?? "").trim();
    const messages = [
      { content: question, role: "user" as const },
      ...(followUp ? [{ content: followUp, role: "user" as const }] : []),
    ];
    const answer = await generateHelpChatAnswer(messages, {
      live: process.env.RELAYDESK_HELP_EVAL_MODE === "live",
    });
    return {
      metadata: {
        model: answer.model,
        outcome: answer.outcome,
        retrieved: answer.retrieved.map((chunk) => ({
          score: chunk.score,
          sourceId: chunk.sourceId,
        })),
      },
      output: JSON.stringify(answer),
    };
  }
}
