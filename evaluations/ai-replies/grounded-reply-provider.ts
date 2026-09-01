import { config } from "dotenv";

import {
  buildGroundedReplyPrompt,
  generateGroundedReply,
} from "../../src/lib/ai/grounded-reply";
import { tickets } from "../../src/lib/tickets";

config({ path: ".env.local", quiet: true });

type ProviderContext = {
  vars?: Record<string, unknown>;
};

export default class GroundedReplyProvider {
  id() {
    return "relaydesk:grounded-reply";
  }

  async callApi(_prompt: string, context?: ProviderContext) {
    const ticketId = String(context?.vars?.ticketId ?? "");
    const ticket = tickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return { error: `Unknown evaluation ticket ${ticketId}` };

    const result = await generateGroundedReply(ticket, {
      live: process.env.RELAYDESK_EVAL_MODE === "live",
    });
    return {
      metadata: {
        citationIds: result.citationIds,
        mode: result.mode,
        model: result.model,
        prompt: buildGroundedReplyPrompt(ticket),
      },
      output: JSON.stringify(result),
    };
  }
}
