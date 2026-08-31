import { filterTickets } from "@/lib/inbox";
import { tickets } from "@/lib/tickets";
import type { QueueFilter } from "@/lib/types";

const queueFilters = new Set<QueueFilter>(["all", "mine", "unassigned", "urgent"]);

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const requestedFilter = searchParams.get("filter") ?? "all";
  const filter = queueFilters.has(requestedFilter as QueueFilter)
    ? (requestedFilter as QueueFilter)
    : "all";

  return Response.json({
    data: filterTickets(tickets, query, filter),
    meta: { query, filter, total: tickets.length },
  });
}
