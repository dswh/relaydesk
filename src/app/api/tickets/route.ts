import { getTicketPage } from "@/lib/ticket-repository";
import type { QueueFilter } from "@/lib/types";

const queueFilters = new Set<QueueFilter>(["all", "mine", "unassigned", "urgent"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const requestedFilter = searchParams.get("filter") ?? "all";
  const filter = queueFilters.has(requestedFilter as QueueFilter)
    ? (requestedFilter as QueueFilter)
    : "all";

  const page = await getTicketPage({
    filter,
    includeFirstDetail: false,
    search: query,
  });

  return Response.json(
    {
      data: page.tickets,
      meta: {
        query: page.query,
        filter: page.filter,
        returned: page.tickets.length,
        summary: page.summary,
        source: page.source,
        durationMs: Number(page.durationMs.toFixed(2)),
      },
    },
    {
      headers: {
        "Server-Timing": `repository;dur=${page.durationMs.toFixed(2)}`,
        "X-RelayDesk-Data-Source": page.source,
      },
    },
  );
}
