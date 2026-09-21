-- Calisthenics Cert Journal — schema v2
-- Run this in Supabase SQL editor (or via `supabase db push`).
--
-- v2 adds day-level tracking within a week: metrics, photos, tags and
-- day notes now live on `entry_days` (one row per calendar day) instead
-- of directly on `entries`. `summary` and `homework` stay week-level.
--
-- This is a clean-slate rewrite (drops and recreates v1 tables) — only
-- safe to run against a project with no real data yet.

create extension if not exists "pgcrypto";

drop table if exists homework;
drop table if exists tags;
drop table if exists photos;
drop table if exists metrics;
drop table if exists entry_days;
drop table if exists entries;

-- One row per week. The container you navigate by; summary and
-- homework are authored at this level as a roll-up of the week's days.
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  week_start date not null,          -- Monday of the week this entry covers
  title text,
  summary text,                      -- short weekly recap, written by you
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, week_start)       -- one entry per week per user
);

-- One row per calendar day within a week. Metrics/photos/tags/day
-- notes all hang off this, so progression can be tracked day by day.
create table entry_days (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null,
  day_date date not null,
  notes text,                        -- free text for that specific day
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (entry_id, day_date)        -- one row per day per week
);

-- A day must fall within the 7-day span starting at its week's week_start.
-- Enforced via trigger since the check spans two tables.
create or replace function check_entry_day_within_week()
returns trigger as $$
declare
  entry_week_start date;
begin
  select week_start into entry_week_start from entries where id = new.entry_id;
  if new.day_date < entry_week_start or new.day_date > entry_week_start + 6 then
    raise exception 'day_date % is outside the entry''s week starting %', new.day_date, entry_week_start;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger entry_days_within_week
  before insert or update on entry_days
  for each row execute function check_entry_day_within_week();

-- Structured progression data: reps, hold times, skill levels etc.
-- Kept separate (not JSON) so charts/queries over time are trivial later.
create table metrics (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references entry_days(id) on delete cascade not null,
  name text not null,                -- e.g. "pull-up", "L-sit hold"
  value numeric not null,            -- 8 (reps), 25 (seconds), etc.
  unit text not null default 'reps', -- "reps", "seconds", "level"
  created_at timestamptz default now()
);

-- Progress photos, stored in Supabase Storage; this table holds pointers.
create table photos (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references entry_days(id) on delete cascade not null,
  storage_path text not null,        -- path within the 'journal-photos' bucket
  caption text,
  created_at timestamptz default now()
);

-- Free-text tags — doubles as "what I learned" links (e.g. "shoulder anatomy").
-- Shares vocabulary with future micro-learning topics/lessons.
create table tags (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references entry_days(id) on delete cascade not null,
  label text not null
);

-- Next-week homework / to-dos set by you at the end of an entry.
-- Stays week-level — homework is planned for the week ahead, not a day.
create table homework (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null, -- the entry it was assigned FROM
  description text not null,
  done boolean not null default false,
  created_at timestamptz default now()
);

-- Row Level Security: every table is single-user-scoped via entries.user_id
alter table entries enable row level security;
alter table entry_days enable row level security;
alter table metrics enable row level security;
alter table photos enable row level security;
alter table tags enable row level security;
alter table homework enable row level security;

create policy "own entries" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own entry days" on entry_days
  for all using (
    exists (select 1 from entries where entries.id = entry_days.entry_id and entries.user_id = auth.uid())
  ) with check (
    exists (select 1 from entries where entries.id = entry_days.entry_id and entries.user_id = auth.uid())
  );

create policy "own metrics" on metrics
  for all using (
    exists (
      select 1 from entry_days
      join entries on entries.id = entry_days.entry_id
      where entry_days.id = metrics.day_id and entries.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from entry_days
      join entries on entries.id = entry_days.entry_id
      where entry_days.id = metrics.day_id and entries.user_id = auth.uid()
    )
  );

create policy "own photos" on photos
  for all using (
    exists (
      select 1 from entry_days
      join entries on entries.id = entry_days.entry_id
      where entry_days.id = photos.day_id and entries.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from entry_days
      join entries on entries.id = entry_days.entry_id
      where entry_days.id = photos.day_id and entries.user_id = auth.uid()
    )
  );

create policy "own tags" on tags
  for all using (
    exists (
      select 1 from entry_days
      join entries on entries.id = entry_days.entry_id
      where entry_days.id = tags.day_id and entries.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from entry_days
      join entries on entries.id = entry_days.entry_id
      where entry_days.id = tags.day_id and entries.user_id = auth.uid()
    )
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
