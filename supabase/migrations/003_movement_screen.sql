-- Migration: calisthenics-specific movement screen per client.
-- Additive only — safe to run on top of 001 and 002.
-- Separate from PAR-Q: PAR-Q is generic medical clearance, this is the
-- discipline-specific baseline/mobility/history assessment that follows it.

create table if not exists movement_screens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null unique,

  -- Baseline strength
  max_pull_ups integer,
  max_push_ups integer,
  max_dips integer,
  max_squat_reps integer,

  -- Mobility checks — checked means a restriction was observed (same
  -- "checked = flag" convention as the PAR-Q questions above them).
  shoulder_overhead_restricted boolean not null default false,
  wrist_extension_restricted boolean not null default false,
  ankle_hip_restricted boolean not null default false,

  -- Training experience & goals
  years_training numeric,
  current_goal text,

  -- Prior injuries / areas to avoid loading
  injury_notes text,

  assessed_at date not null default current_date,
  updated_at timestamptz default now()
);

alter table movement_screens enable row level security;

create policy "own movement screens" on movement_screens
  for all using (
    exists (select 1 from clients where clients.id = movement_screens.client_id and clients.user_id = auth.uid())
  ) with check (
    exists (select 1 from clients where clients.id = movement_screens.client_id and clients.user_id = auth.uid())
  );
