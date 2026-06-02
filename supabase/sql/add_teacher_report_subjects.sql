-- School Connect: configurable teacher report subjects
-- Run this once in Supabase SQL editor before saving subjects from Teacher Settings.

alter table public.teachers
add column if not exists report_subjects jsonb default '["Mathematics","English","Life Skills","Behaviour"]'::jsonb;

update public.teachers
set report_subjects = '["Mathematics","English","Life Skills","Behaviour"]'::jsonb
where report_subjects is null;
