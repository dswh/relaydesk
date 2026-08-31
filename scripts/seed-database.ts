import { Pool, type PoolClient } from "pg";

import { tickets } from "../src/lib/tickets";
import type { Priority } from "../src/lib/types";
import { requireDatabaseUrl } from "./database-environment";

const pool = new Pool({ connectionString: requireDatabaseUrl() });
const DATASET_SIZE = Number(process.env.RELAYDESK_DATASET_SIZE ?? 100_000);

const priorityRank: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

async function seedPrimaryTickets(client: PoolClient, organizationId: string) {
  for (const ticket of tickets) {
    const customerResult = await client.query<{ id: string }>(
      `
        insert into customers (
          organization_id, external_id, name, email, company, plan, initials,
          since_label, local_time_label, health, lifetime_value_cents
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        returning id::text
      `,
      [
        organizationId,
        ticket.customer.id,
        ticket.customer.name,
        ticket.customer.email,
        ticket.customer.company,
        ticket.customer.plan,
        ticket.customer.initials,
        ticket.customer.since,
        ticket.customer.timezone,
        ticket.customer.health,
        Number(ticket.customer.lifetimeValue.replace(/[$,]/g, "")) * 100,
      ],
    );
    const customerId = customerResult.rows[0]?.id;
    if (!customerId) throw new Error(`Could not seed ${ticket.customer.id}`);

    await client.query(
      `
        insert into tickets (
          organization_id, customer_id, external_id, subject, preview, priority,
          priority_rank, status, channel, assignee, updated_at, updated_label,
          waiting_minutes, sla_minutes, tags, intent, sentiment, summary, messages,
          sources, suggested_reply, search_text
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          now() - make_interval(mins => $11), $12, $13, $14, $15, $16, $17, $18,
          $19::jsonb, $20::jsonb, $21, $22
        )
      `,
      [
        organizationId,
        customerId,
        ticket.id,
        ticket.subject,
        ticket.preview,
        ticket.priority,
        priorityRank[ticket.priority],
        ticket.status,
        ticket.channel,
        ticket.assignee,
        ticket.waitingMinutes,
        ticket.updatedAt,
        ticket.waitingMinutes,
        ticket.slaMinutes,
        ticket.tags,
        ticket.intent,
        ticket.sentiment,
        ticket.summary,
        JSON.stringify(ticket.messages),
        JSON.stringify(ticket.sources),
        ticket.suggestedReply,
        [
          ticket.id,
          ticket.subject,
          ticket.preview,
          ticket.customer.name,
          ticket.customer.company,
          ticket.customer.email,
          ...ticket.tags,
        ].join(" "),
      ],
    );
  }
}

async function seedLoadDataset(client: PoolClient, organizationId: string) {
  const customerCount = Math.max(1_000, Math.ceil(DATASET_SIZE / 20));

  await client.query(
    `
      insert into customers (
        organization_id, external_id, name, email, company, plan, initials,
        since_label, local_time_label, health, lifetime_value_cents
      )
      select
        $1,
        'cus_load_' || lpad(series::text, 6, '0'),
        'Support Contact ' || series,
        'contact' || series || '@example.test',
        'Benchmark Account ' || series,
        (array['Enterprise', 'Scale', 'Growth', 'Starter'])[(series % 4) + 1],
        'SC',
        'Jan 2026',
        'UTC',
        (array['healthy', 'healthy', 'watch'])[(series % 3) + 1],
        120000 + (series % 200) * 1000
      from generate_series(1, $2::integer) as series
    `,
    [organizationId, customerCount],
  );

  await client.query(
    `
      with generated as (
        select
          series,
          ((series - 1) % $3::integer) + 1 as customer_sequence,
          (array['billing export', 'webhook retry', 'SSO verification', 'data migration',
            'team permissions', 'API attachment', 'invoice correction', 'account access'])[(series % 8) + 1] as topic
        from generate_series(1, $2::integer) as series
      )
      insert into tickets (
        organization_id, customer_id, external_id, subject, preview, priority,
        priority_rank, status, channel, assignee, updated_at, updated_label,
        waiting_minutes, sla_minutes, tags, intent, sentiment, summary, messages,
        sources, suggested_reply, search_text
      )
      select
        $1,
        c.id,
        'RD-' || (200000 + g.series),
        initcap(g.topic) || ' question',
        'A customer needs help with ' || g.topic || ' in their workspace.',
        case when g.series % 17 = 0 then 'high' else 'normal' end,
        case when g.series % 17 = 0 then 1 else 2 end,
        case when g.series % 13 = 0 then 'pending' else 'open' end,
        (array['email', 'chat', 'api'])[(g.series % 3) + 1],
        case when g.series % 5 = 0 then 'You' when g.series % 3 = 0 then null else 'Sam R.' end,
        now() - make_interval(mins => (g.series % 25)::integer),
        (g.series % 25)::text || ' min',
        g.series % 25,
        240,
        array[split_part(g.topic, ' ', 1), 'benchmark'],
        'Support request',
        (array['neutral', 'neutral', 'positive', 'frustrated'])[(g.series % 4) + 1],
        'The customer needs a clear next step based on approved support guidance.',
        '[]'::jsonb,
        '[]'::jsonb,
        'Thanks for contacting us. We are reviewing the request and will confirm the next step.',
        'RD-' || (200000 + g.series) || ' ' || g.topic || ' ' ||
          c.name || ' ' || c.company || ' benchmark'
      from generated g
      join customers c
        on c.organization_id = $1
       and c.external_id = 'cus_load_' || lpad(g.customer_sequence::text, 6, '0')
    `,
    [organizationId, DATASET_SIZE, customerCount],
  );
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from organizations where slug = 'northstar-labs'");
    const organization = await client.query<{ id: string }>(
      `insert into organizations (slug, name)
       values ('northstar-labs', 'Northstar Labs')
       returning id::text`,
    );
    const organizationId = organization.rows[0]?.id;
    if (!organizationId) throw new Error("Could not create the synthetic workspace.");

    await seedPrimaryTickets(client, organizationId);
    await seedLoadDataset(client, organizationId);
    await client.query("analyze customers");
    await client.query("analyze tickets");
    await client.query("commit");
    console.info(
      `Seeded ${DATASET_SIZE + tickets.length} tickets for Northstar Labs.`,
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await seed();
} finally {
  await pool.end();
}

