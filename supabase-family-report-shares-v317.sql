-- Family report share links for School Connect.
-- Run this once in Supabase SQL editor before using Family Share.

create table if not exists public.family_report_shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  parent_link_id uuid null,
  child_id uuid not null,
  school_id uuid null,
  teacher_id uuid null,
  report_id uuid null,
  include_moments boolean not null default false,
  is_active boolean not null default true,
  expires_at timestamptz null,
  last_viewed_at timestamptz null,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_report_shares_token_idx
  on public.family_report_shares(token);

create index if not exists family_report_shares_child_id_idx
  on public.family_report_shares(child_id);

create index if not exists family_report_shares_parent_link_id_idx
  on public.family_report_shares(parent_link_id);
