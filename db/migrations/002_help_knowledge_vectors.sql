create extension if not exists vector;

create table if not exists help_knowledge_documents (
  id text primary key,
  slug text not null unique,
  title text not null,
  collection text not null,
  visibility text not null check (visibility in ('public', 'internal', 'restricted')),
  status text not null check (status in ('draft', 'approved', 'superseded')),
  content_hash text not null,
  updated_at date not null,
  metadata jsonb not null default '{}'::jsonb,
  indexed_at timestamptz not null default now()
);

create table if not exists help_knowledge_chunks (
  id text primary key,
  document_id text not null references help_knowledge_documents(id) on delete cascade,
  source_id text not null,
  heading text not null,
  content text not null,
  chunk_index integer not null check (chunk_index >= 0),
  embedding_model text not null,
  embedding vector not null,
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector('english'::regconfig, coalesce(heading, '') || ' ' || coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index, embedding_model)
);

create index if not exists help_knowledge_chunks_document_idx
  on help_knowledge_chunks (document_id, chunk_index);

create index if not exists help_knowledge_chunks_model_idx
  on help_knowledge_chunks (embedding_model);

create index if not exists help_knowledge_chunks_search_idx
  on help_knowledge_chunks using gin (search_vector);
