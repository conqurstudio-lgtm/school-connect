create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.child_parent_links (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null,
  child_id uuid not null,
  teacher_id uuid,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  is_active boolean not null default true,
  last_sent_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists child_parent_links_child_id_idx
  on public.child_parent_links(child_id);

create index if not exists child_parent_links_token_idx
  on public.child_parent_links(token);

notify pgrst, 'reload schema';
