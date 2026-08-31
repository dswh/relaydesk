import { Pool } from "pg";

import { requireDatabaseUrl } from "./database-environment";

type ExplainNode = {
  "Node Type": string;
  "Index Name"?: string;
  Plans?: ExplainNode[];
};

type ExplainDocument = {
  Plan: ExplainNode;
  "Execution Time": number;
  "Planning Time": number;
};

const pool = new Pool({ connectionString: requireDatabaseUrl() });

function flattenPlan(node: ExplainNode): ExplainNode[] {
  return [node, ...(node.Plans?.flatMap(flattenPlan) ?? [])];
}

async function verify() {
  const count = await pool.query<{ count: string }>(`
    select count(*)::text
    from tickets t
    join organizations o on o.id = t.organization_id
    where o.slug = 'northstar-labs'
  `);
  const ticketCount = Number(count.rows[0]?.count ?? 0);
  if (ticketCount < 100_000) {
    throw new Error(`Expected at least 100000 tickets, found ${ticketCount}.`);
  }

  const correctness = await pool.query<{ external_id: string }>(`
    select t.external_id
    from tickets t
    where t.organization_id = (
        select id from organizations where slug = 'northstar-labs'
      )
      and t.search_vector @@ websearch_to_tsquery('english', 'Atlas Health')
  `);
  if (!correctness.rows.some((row) => row.external_id === "RD-1842")) {
    throw new Error("Search correctness failed: Atlas Health did not return RD-1842.");
  }

  const explain = await pool.query<{ "QUERY PLAN": ExplainDocument[] }>(`
    explain (analyze, buffers, format json)
    select t.id
    from tickets t
    join organizations o on o.id = t.organization_id
    where o.slug = 'northstar-labs'
      and t.is_active = true
      and t.search_vector @@ websearch_to_tsquery('english', 'Atlas Health')
    limit 50
  `);
  const document = explain.rows[0]?.["QUERY PLAN"]?.[0];
  if (!document) throw new Error("PostgreSQL did not return an execution plan.");

  const planNodes = flattenPlan(document.Plan);
  const usesSearchIndex = planNodes.some(
    (node) => node["Index Name"] === "tickets_search_idx",
  );
  if (!usesSearchIndex) {
    throw new Error("Search verification failed: tickets_search_idx was not used.");
  }
  if (document["Execution Time"] >= 100) {
    throw new Error(
      `Search execution exceeded 100 ms: ${document["Execution Time"]} ms.`,
    );
  }


  const queueExplain = await pool.query<{ "QUERY PLAN": ExplainDocument[] }>(`
    explain (analyze, buffers, format json)
    select t.id
    from tickets t
    where t.organization_id = (
        select id from organizations where slug = 'northstar-labs'
      )
      and t.is_active = true
    order by t.priority_rank, t.waiting_minutes desc, t.id desc
    limit 50
  `);
  const queueDocument = queueExplain.rows[0]?.["QUERY PLAN"]?.[0];
  if (!queueDocument) throw new Error("PostgreSQL did not return a queue plan.");
  const queuePlanNodes = flattenPlan(queueDocument.Plan);
  const usesQueueIndex = queuePlanNodes.some(
    (node) => node["Index Name"] === "tickets_queue_active_idx",
  );
  if (!usesQueueIndex) {
    throw new Error("Queue verification failed: tickets_queue_active_idx was not used.");
  }
  if (queueDocument["Execution Time"] >= 100) {
    throw new Error(
      `Queue execution exceeded 100 ms: ${queueDocument["Execution Time"]} ms.`,
    );
  }

  console.info(
    JSON.stringify(
      {
        datasetTickets: ticketCount,
        queue: {
          executionMs: queueDocument["Execution Time"],
          index: "tickets_queue_active_idx",
          planningMs: queueDocument["Planning Time"],
        },
        search: {
          executionMs: document["Execution Time"],
          index: "tickets_search_idx",
          planningMs: document["Planning Time"],
          returns: "RD-1842",
        },
        status: "pass",
      },
      null,
      2,
    ),
  );
}

try {
  await verify();
} finally {
  await pool.end();
}
