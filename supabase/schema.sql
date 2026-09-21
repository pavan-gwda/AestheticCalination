-- Calisthenics Cert Journal — schema v1
-- Run this in Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- One row per week. This is the core entity.
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  week_start date not null,          -- Monday of the week this entry covers
  title text,
  notes text,                        -- free text, markdown-friendly
  summary text,                      -- short weekly recap, written by you
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, week_start)       -- one entry per week per user
);

-- Structured progression data: reps, hold times, skill levels etc.
-- Kept separate (not JSON) so charts/queries over time are trivial later.
create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null,
  name text not null,                -- e.g. "pull-up", "L-sit hold"
  value numeric not null,            -- 8 (reps), 25 (seconds), etc.
  unit text not null default 'reps', -- "reps", "seconds", "level"
  created_at timestamptz default now()
);

-- Progress photos, stored in Supabase Storage; this table holds pointers.
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null,
  storage_path text not null,        -- path within the 'journal-photos' bucket
  caption text,
  created_at timestamptz default now()
);

-- Free-text tags — doubles as "what I learned" links (e.g. "shoulder anatomy").
-- Shares vocabulary with future micro-learning topics/lessons.
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null,
  label text not null
);

-- Next-week homework / to-dos set by you at the end of an entry.
create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null, -- the entry it was assigned FROM
  description text not null,
  done boolean not null default false,
  created_at timestamptz default now()
);

-- Row Level Security: every table is single-user-scoped via entries.user_id
alter table entries enable row level security;
alter table metrics enable row level security;
alter table photos enable row level security;
alter table tags enable row level security;
alter table homework enable row level security;

create policy "own entries" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own metrics" on metrics
  for all using (
    exists (select 1 from entries where entries.id = metrics.entry_id and entries.user_id = auth.uid())
  ) with check (
    exists (select 1 from entries where entries.id = metrics.entry_id and entries.user_id = auth.uid())
  );

create policy "own photos" on photos
  for all using (
    exists (select 1 from entries where entries.id = photos.entry_id and entries.user_id = auth.uid())
  ) with check (
    exists (select 1 from entries where entries.id = photos.entry_id and entries.user_id = auth.uid())
  );

create policy "own tags" on tags
  for all using (
    exists (select 1 from entries where entries.id = tags.entry_id and entries.user_id = auth.uid())
  ) with check (
    exists (select 1 from entries where entries.id = tags.entry_id and entries.user_id = auth.uid())
  );

create policy "own homework" on homework
  for all using (
    exists (select 1 from entries where entries.id = homework.entry_id and entries.user_id = auth.uid())
  ) with check (
    exists (select 1 from entries where entries.id = homework.entry_id and entries.user_id = auth.uid())
  );

-- Storage bucket for photos (run once)
insert into storage.buckets (id, name, public) values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

create policy "own photo files" on storage.objects
  for all using (bucket_id = 'journal-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'journal-photos' and auth.uid()::text = (storage.foldername(name))[1]);
