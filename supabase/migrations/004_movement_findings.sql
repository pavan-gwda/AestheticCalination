-- Migration: free-form movement findings per client, on top of the
-- fixed 3-question mobility check. Additive only — safe on top of 001-003.

create table if not exists movement_findings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  label text not null,
  created_at timestamptz default now()
);

alter table movement_findings enable row level security;

create policy "own movement findings" on movement_findings
  for all using (
    exists (select 1 from clients where clients.id = movement_findings.client_id and clients.user_id = auth.uid())
  ) with check (
    exists (select 1 from clients where clients.id = movement_findings.client_id and clients.user_id = auth.uid())
  );
