-- Migration: image attachments for homework items.
-- Additive only — safe to run on top of schema.sql (v2) without any data loss.
-- Reuses the existing 'journal-photos' storage bucket and its auth.uid()-prefixed
-- path policy, so no storage changes are needed.

create table if not exists homework_attachments (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid references homework(id) on delete cascade not null,
  storage_path text not null,
  created_at timestamptz default now()
);

alter table homework_attachments enable row level security;

create policy "own homework attachments" on homework_attachments
  for all using (
    exists (
      select 1 from homework
      join entries on entries.id = homework.entry_id
      where homework.id = homework_attachments.homework_id and entries.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from homework
      join entries on entries.id = homework.entry_id
      where homework.id = homework_attachments.homework_id and entries.user_id = auth.uid()
    )
  );
