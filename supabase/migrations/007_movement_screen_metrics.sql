-- Migration: baseline "current movements & metrics" recorded during the
-- movement screen itself, separate from client_metrics (which is the
-- coach-authored Progression / recommended targets list). Same shape as
-- client_metrics, different table so the two lists stay independent.
-- Additive only.

create table if not exists movement_screen_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  name text not null,
  value numeric not null,
  unit text not null default 'reps',
  category text not null default 'Other',
  notes text,
  recorded_at date not null default current_date,
  created_at timestamptz default now()
);

alter table movement_screen_metrics enable row level security;

create policy "own movement screen metrics" on movement_screen_metrics
  for all using (
    exists (select 1 from clients where clients.id = movement_screen_metrics.client_id and clients.user_id = auth.uid())
  ) with check (
    exists (select 1 from clients where clients.id = movement_screen_metrics.client_id and clients.user_id = auth.uid())
  );
