-- School Connect MVP signup safety checks.
-- Run in Supabase SQL Editor if signup reports missing columns.

alter table if exists public.schools
  add column if not exists tagline text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists country text default 'South Africa',
  add column if not exists settings jsonb default '{}'::jsonb,
  add column if not exists is_verified boolean not null default false,
  add column if not exists is_active boolean not null default true;

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists school_id uuid,
  add column if not exists onboarding_done boolean not null default false;
