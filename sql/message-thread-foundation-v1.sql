-- School Connect - Message Thread Foundation v1
-- Run this in Supabase SQL Editor before applying the code patch.

create table if not exists public.teacher_parent_threads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid null references public.children(id) on delete set null,
  last_parent_seen_at timestamptz null,
  last_teacher_seen_at timestamptz null,
  last_message_at timestamptz null,
  last_message_from text null check (last_message_from in ('parent', 'teacher')),
  unread_for_parent integer not null default 0,
  unread_for_teacher integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_parent_threads_unique unique (teacher_id, parent_id)
);

create index if not exists teacher_parent_threads_parent_idx
  on public.teacher_parent_threads(parent_id);

create index if not exists teacher_parent_threads_teacher_idx
  on public.teacher_parent_threads(teacher_id);

alter table public.teacher_parent_threads disable row level security;

select 'message thread foundation v1 ready' as status;
