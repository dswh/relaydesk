import { generateGroundedReply } from "@/lib/ai/grounded-reply";
import { getTicketById } from "@/lib/ticket-repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ticket = await getTicketById(id);

  if (!ticket) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (!ticket.sources.length) {
    return Response.json(
      { error: "No approved grounding source is available for this ticket" },
      { status: 422 },
    );
  }

  try {
    return Response.json({ data: await generateGroundedReply(ticket) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reply generation failed";
    return Response.json({ error: message }, { status: 503 });
  }
}
