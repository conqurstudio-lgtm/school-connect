create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  share_mode text not null check (share_mode in ('child', 'all')),
  note text,
  file_url text not null,
  file_path text,
  file_name text,
  file_type text not null check (file_type in ('image', 'document')),
  mime_type text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.moment_recipients (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  parent_whatsapp text,
  parent_email text,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(moment_id, child_id)
);

create table if not exists public.moment_reactions (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  reaction text not null check (reaction in ('heart', 'like', 'smile')),
  created_at timestamptz not null default now(),
  unique(moment_id, child_id)
);

create index if not exists moments_school_teacher_idx
on public.moments(school_id, teacher_id, created_at desc);

create index if not exists moment_recipients_child_idx
on public.moment_recipients(child_id, created_at desc);

create index if not exists moment_reactions_moment_idx
on public.moment_reactions(moment_id);
