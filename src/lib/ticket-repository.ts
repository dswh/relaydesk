import { databaseConfigured, query as databaseQuery } from "@/lib/db";
import { filterTickets, summarizeQueue } from "@/lib/inbox";
import { tickets as developmentTickets } from "@/lib/tickets";
import type {
  Channel,
  Customer,
  Message,
  Priority,
  QueueFilter,
  QueueSummary,
  Ticket,
  TicketStatus,
} from "@/lib/types";

const WORKSPACE_SLUG = "northstar-labs";
const MAX_PAGE_SIZE = 50;

type TicketRow = {
  external_id: string;
  subject: string;
  preview: string;
  priority: Priority;
  status: TicketStatus;
  channel: Channel;
  assignee: string | null;
  updated_label: string;
  waiting_minutes: number;
  sla_minutes: number;
  tags: string[];
  intent: string;
  sentiment: Ticket["sentiment"];
  summary: string;
  messages: Message[];
  sources: Ticket["sources"];
  suggested_reply: string;
  customer_external_id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_plan: Customer["plan"];
  customer_initials: string;
  customer_since: string;
  customer_timezone: string;
  customer_health: Customer["health"];
  customer_lifetime_value_cents: string;
};

type SummaryRow = {
  all_count: string;
  mine_count: string;
  unassigned_count: string;
  urgent_count: string;
};

export type TicketPage = {
  tickets: Ticket[];
  summary: QueueSummary;
  source: "postgres" | "synthetic-fallback";
  durationMs: number;
  query: string;
  filter: QueueFilter;
};

let summaryCache:
  | { expiresAt: number; value: QueueSummary }
  | undefined;
let summaryRequest: Promise<QueueSummary> | undefined;

function formatLifetimeValue(cents: string) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(cents) / 100);
}

function mapTicket(row: TicketRow, detailsLoaded = true): Ticket {
  return {
    id: row.external_id,
    subject: row.subject,
    preview: row.preview,
    customer: {
      id: row.customer_external_id,
      name: row.customer_name,
      email: row.customer_email,
      company: row.customer_company,
      plan: row.customer_plan,
      initials: row.customer_initials,
      since: row.customer_since,
      timezone: row.customer_timezone,
      health: row.customer_health,
      lifetimeValue: formatLifetimeValue(row.customer_lifetime_value_cents),
    },
    priority: row.priority,
    status: row.status,
    channel: row.channel,
    assignee: row.assignee,
    updatedAt: row.updated_label,
    waitingMinutes: row.waiting_minutes,
    slaMinutes: row.sla_minutes,
    tags: row.tags,
    intent: row.intent,
    sentiment: row.sentiment,
    summary: row.summary,
    messages: row.messages,
    sources: row.sources,
    suggestedReply: row.suggested_reply,
    detailsLoaded,
  };
}

function filterClause(filter: QueueFilter, parameterIndex: number) {
  if (filter === "mine") return `and t.assignee = $${parameterIndex}`;
  if (filter === "unassigned") return "and t.assignee is null";
  if (filter === "urgent") return "and t.priority = 'urgent'";
  return "";
}

export async function getTicketPage({
  filter = "all",
  includeFirstDetail = true,
  search = "",
}: {
  filter?: QueueFilter;
  includeFirstDetail?: boolean;
  search?: string;
} = {}): Promise<TicketPage> {
  const normalizedSearch = search.trim();
  const startedAt = performance.now();

  if (!databaseConfigured()) {
    return {
      tickets: filterTickets(developmentTickets, normalizedSearch, filter).slice(
        0,
        MAX_PAGE_SIZE,
      ),
      summary: summarizeQueue(developmentTickets),
      source: "synthetic-fallback",
      durationMs: performance.now() - startedAt,
      query: normalizedSearch,
      filter,
    };
  }

  const values: unknown[] = [WORKSPACE_SLUG];
  let searchClause = "";
  if (normalizedSearch) {
    values.push(normalizedSearch);
    searchClause = `and t.search_vector @@ websearch_to_tsquery('english', $${values.length})`;
  }

  if (filter === "mine") values.push("You");
  const activeFilterClause = filterClause(filter, values.length);

  const [ticketResult, summary] = await Promise.all([
    databaseQuery<TicketRow>(
      `
        with matched_tickets as materialized (
          select
            t.id,
            t.customer_id,
            t.external_id,
            t.subject,
            t.preview,
            t.priority,
            t.priority_rank,
            t.status,
            t.channel,
            t.assignee,
            t.updated_label,
            t.waiting_minutes,
            t.sla_minutes,
            t.tags,
            t.intent,
            t.sentiment,
            t.summary
          from tickets t
          where t.organization_id = (
              select id from organizations where slug = $1
            )
            and t.is_active = true
            ${searchClause}
            ${activeFilterClause}
          order by t.priority_rank, t.waiting_minutes desc, t.id desc
          limit ${MAX_PAGE_SIZE}
        )
        select
          t.external_id,
          t.subject,
          t.preview,
          t.priority,
          t.status,
          t.channel,
          t.assignee,
          t.updated_label,
          t.waiting_minutes,
          t.sla_minutes,
          t.tags,
          t.intent,
          t.sentiment,
          t.summary,
          '[]'::jsonb as messages,
          '[]'::jsonb as sources,
          ''::text as suggested_reply,
          c.external_id as customer_external_id,
          c.name as customer_name,
          c.email as customer_email,
          c.company as customer_company,
          c.plan as customer_plan,
          c.initials as customer_initials,
          c.since_label as customer_since,
          c.local_time_label as customer_timezone,
          c.health as customer_health,
          c.lifetime_value_cents::text as customer_lifetime_value_cents
        from matched_tickets t
        join customers c on c.id = t.customer_id
        order by t.priority_rank, t.waiting_minutes desc, t.id desc
      `,
      values,
    ),
    getQueueSummary(),
  ]);

  const pageTickets = ticketResult.rows.map((row) => mapTicket(row, false));
  if (includeFirstDetail && pageTickets[0]) {
    const selectedTicket = await getTicketById(pageTickets[0].id);
    if (selectedTicket) pageTickets[0] = selectedTicket;
  }

  return {
    tickets: pageTickets,
    summary,
    source: "postgres",
    durationMs: performance.now() - startedAt,
    query: normalizedSearch,
    filter,
  };
}

async function getQueueSummary(): Promise<QueueSummary> {
  const now = Date.now();
  if (summaryCache && summaryCache.expiresAt > now) return summaryCache.value;
  if (summaryRequest) return summaryRequest;

  summaryRequest = databaseQuery<SummaryRow>(
    `
      select
        count(*) filter (where t.is_active)::text as all_count,
        count(*) filter (where t.is_active and t.assignee = 'You')::text as mine_count,
        count(*) filter (where t.is_active and t.assignee is null)::text as unassigned_count,
        count(*) filter (where t.is_active and t.priority = 'urgent')::text as urgent_count
      from tickets t
      where t.organization_id = (
        select id from organizations where slug = $1
      )
    `,
    [WORKSPACE_SLUG],
  )
    .then((result) => {
      const counts = result.rows[0];
      if (!counts) throw new Error("The Northstar Labs workspace was not seeded.");
      const value = {
        all: Number(counts.all_count),
        mine: Number(counts.mine_count),
        unassigned: Number(counts.unassigned_count),
        urgent: Number(counts.urgent_count),
      };
      summaryCache = { expiresAt: Date.now() + 5_000, value };
      return value;
    })
    .finally(() => {
      summaryRequest = undefined;
    });

  return summaryRequest;
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  if (!databaseConfigured()) {
    return developmentTickets.find((ticket) => ticket.id === id) ?? null;
  }

  const result = await databaseQuery<TicketRow>(
    `
      select
        t.external_id,
        t.subject,
        t.preview,
        t.priority,
        t.status,
        t.channel,
        t.assignee,
        t.updated_label,
        t.waiting_minutes,
        t.sla_minutes,
        t.tags,
        t.intent,
        t.sentiment,
        t.summary,
        t.messages,
        t.sources,
        t.suggested_reply,
        c.external_id as customer_external_id,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company,
        c.plan as customer_plan,
        c.initials as customer_initials,
        c.since_label as customer_since,
        c.local_time_label as customer_timezone,
        c.health as customer_health,
        c.lifetime_value_cents::text as customer_lifetime_value_cents
      from tickets t
      join customers c on c.id = t.customer_id
      where t.organization_id = (
          select id from organizations where slug = $1
        )
        and t.external_id = $2
      limit 1
    `,
    [WORKSPACE_SLUG, id],
  );

  return result.rows[0] ? mapTicket(result.rows[0]) : null;
}
