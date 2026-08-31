import type { QueueFilter, QueueSummary, Ticket } from "@/lib/types";

const priorityRank = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
} as const;

export function summarizeQueue(tickets: Ticket[]): QueueSummary {
  const active = tickets.filter((ticket) => ticket.status !== "resolved");

  return {
    all: active.length,
    mine: active.filter((ticket) => ticket.assignee === "You").length,
    unassigned: active.filter((ticket) => ticket.assignee === null).length,
    urgent: active.filter((ticket) => ticket.priority === "urgent").length,
  };
}

export function filterTickets(
  tickets: Ticket[],
  query: string,
  filter: QueueFilter,
): Ticket[] {
  const normalizedQuery = query.trim().toLowerCase();

  return tickets
    .filter((ticket) => {
      if (filter === "mine" && ticket.assignee !== "You") return false;
      if (filter === "unassigned" && ticket.assignee !== null) return false;
      if (filter === "urgent" && ticket.priority !== "urgent") return false;
      return ticket.status !== "resolved" || filter === "all";
    })
    .filter((ticket) => {
      if (!normalizedQuery) return true;
      const searchable = [
        ticket.id,
        ticket.subject,
        ticket.customer.name,
        ticket.customer.company,
        ...ticket.tags,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const priorityDifference =
        priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDifference !== 0) return priorityDifference;
      return b.waitingMinutes - a.waitingMinutes;
    });
}

export function getSlaProgress(ticket: Ticket): number {
  if (ticket.slaMinutes === 0) return 0;
  return Math.min(100, Math.round((ticket.waitingMinutes / ticket.slaMinutes) * 100));
}

export function getSlaState(ticket: Ticket): "safe" | "watch" | "risk" {
  const progress = getSlaProgress(ticket);
  if (progress >= 75) return "risk";
  if (progress >= 50) return "watch";
  return "safe";
}
