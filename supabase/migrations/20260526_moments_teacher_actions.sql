alter table public.moments
add column if not exists is_pinned boolean not null default false;

alter table public.moments
add column if not exists deleted_at timestamptz;

create index if not exists moments_teacher_visible_idx
on public.moments(teacher_id, deleted_at, is_pinned, created_at desc);
