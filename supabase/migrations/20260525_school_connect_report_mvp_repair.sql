-- School Connect MVP database repair
-- Fixes: Could not find the 'parent_email' column of 'children' in the schema cache

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

alter table public.children
  add column if not exists parent_whatsapp text,
  add column if not exists parent_email text,
  add column if not exists created_by_teacher_id uuid,
  add column if not exists status text default 'active',
  add column if not exists updated_at timestamptz default now();

create table if not exists public.child_reports (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null,
  child_id uuid not null,
  teacher_id uuid not null,
  week_starting date not null,
  scores jsonb not null default '{}'::jsonb,
  comment text,
  status text not null default 'published',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.child_reports
  add column if not exists school_id uuid,
  add column if not exists child_id uuid,
  add column if not exists teacher_id uuid,
  add column if not exists week_starting date,
  add column if not exists scores jsonb default '{}'::jsonb,
  add column if not exists comment text,
  add column if not exists status text default 'published',
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists child_reports_one_per_week
  on public.child_reports(child_id, teacher_id, week_starting);

create table if not exists public.child_report_links (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null,
  school_id uuid not null,
  child_id uuid not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists child_report_links_report_id_idx
  on public.child_report_links(report_id);

create index if not exists child_report_links_token_idx
  on public.child_report_links(token);

create table if not exists public.whatsapp_notifications (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid,
  school_id uuid,
  child_id uuid,
  parent_whatsapp text not null,
  message text not null,
  magic_link text,
  status text not null default 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists whatsapp_notifications_status_idx
  on public.whatsapp_notifications(status, created_at);

-- Refresh Supabase/PostgREST schema cache.
notify pgrst, 'reload schema';
