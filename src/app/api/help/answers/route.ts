import {
  createHelpChatStream,
  type HelpChatMessage,
} from "@/lib/ai/help-chat";

function validMessages(value: unknown): value is HelpChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 12 &&
    value.every(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        "role" in message &&
        (message.role === "user" || message.role === "assistant") &&
        "content" in message &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= 2_000,
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const messages =
    typeof body === "object" && body !== null && "messages" in body
      ? body.messages
      : undefined;
  if (!validMessages(messages)) {
    return Response.json(
      { error: "Provide between 1 and 12 valid chat messages." },
      { status: 400 },
    );
  }

  return new Response(
    createHelpChatStream(messages, { abortSignal: request.signal }),
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
