import type { Metadata } from "next";

import { InboxWorkspace } from "@/components/inbox-workspace";
import { getTicketPage } from "@/lib/ticket-repository";
import type { QueueFilter } from "@/lib/types";

export const metadata: Metadata = {
  title: "Inbox",
};

const queueFilters = new Set<QueueFilter>(["all", "mine", "unassigned", "urgent"]);

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const parameters = await searchParams;
  const requestedFilter = parameters.filter ?? "all";
  const filter = queueFilters.has(requestedFilter as QueueFilter)
    ? (requestedFilter as QueueFilter)
    : "all";
  const search = parameters.q ?? "";
  const page = await getTicketPage({ filter, search });

  return (
    <InboxWorkspace
      initialFilter={filter}
      initialQuery={search}
      initialSummary={page.summary}
      initialTickets={page.tickets}
      key={`${filter}:${search}`}
    />
  );
}
