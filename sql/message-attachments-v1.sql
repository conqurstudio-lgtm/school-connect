-- School Connect - Message Attachments v1
-- Run in Supabase SQL Editor before applying the code patch.

alter table public.updates
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'update-attachments',
  'update-attachments',
  true,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

select 'message attachments v1 ready' as status;
