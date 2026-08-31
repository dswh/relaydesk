create table if not exists organizations (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id bigint generated always as identity primary key,
  organization_id bigint not null references organizations(id) on delete cascade,
  external_id text not null,
  name text not null,
  email text not null,
  company text not null,
  plan text not null check (plan in ('Enterprise', 'Scale', 'Growth', 'Starter')),
  initials text not null,
  since_label text not null,
  local_time_label text not null,
  health text not null check (health in ('healthy', 'watch', 'risk')),
  lifetime_value_cents bigint not null check (lifetime_value_cents >= 0),
  created_at timestamptz not null default now(),
  unique (organization_id, external_id)
);

create index if not exists customers_organization_id_idx
  on customers (organization_id);

create table if not exists tickets (
  id bigint generated always as identity primary key,
  organization_id bigint not null references organizations(id) on delete cascade,
  customer_id bigint not null references customers(id) on delete cascade,
  external_id text not null,
  subject text not null,
  preview text not null,
  priority text not null check (priority in ('urgent', 'high', 'normal', 'low')),
  priority_rank smallint not null check (priority_rank between 0 and 3),
  status text not null check (status in ('open', 'pending', 'resolved')),
  is_active boolean generated always as (status <> 'resolved') stored,
  channel text not null check (channel in ('email', 'chat', 'api')),
  assignee text,
  updated_at timestamptz not null,
  updated_label text not null,
  waiting_minutes integer not null check (waiting_minutes >= 0),
  sla_minutes integer not null check (sla_minutes > 0),
  tags text[] not null default '{}',
  intent text not null,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'frustrated')),
  summary text not null,
  messages jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  suggested_reply text not null default '',
  search_text text not null,
  search_vector tsvector generated always as (
    to_tsvector('english'::regconfig, coalesce(search_text, ''))
  ) stored,
  created_at timestamptz not null default now(),
  unique (organization_id, external_id)
);

create index if not exists tickets_customer_id_idx
  on tickets (customer_id);

create index if not exists tickets_queue_active_idx
  on tickets (
    organization_id,
    is_active,
    priority_rank,
    waiting_minutes desc,
    id desc
  );

create index if not exists tickets_assignee_active_idx
  on tickets (organization_id, assignee, is_active, priority_rank, waiting_minutes desc);

create index if not exists tickets_search_idx
  on tickets using gin (search_vector);

