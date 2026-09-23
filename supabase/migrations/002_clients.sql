-- Migration: Practice section — clients, PAR-Q screening, progression metrics.
-- Additive only — safe to run on top of schema.sql + 001_homework_attachments.sql.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  email text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One PAR-Q screen per client (re-editable, not a history of submissions).
-- Standard 7-question Physical Activity Readiness Questionnaire.
create table if not exists parq_answers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null unique,
  q1_heart_condition boolean not null default false,
  q2_chest_pain_activity boolean not null default false,
  q3_chest_pain_rest boolean not null default false,
  q4_dizziness_balance boolean not null default false,
  q5_bone_joint_problem boolean not null default false,
  q6_bp_or_heart_drugs boolean not null default false,
  q7_other_reason boolean not null default false,
  cleared boolean generated always as (
    not (
      q1_heart_condition or q2_chest_pain_activity or q3_chest_pain_rest or
      q4_dizziness_balance or q5_bone_joint_problem or q6_bp_or_heart_drugs or
      q7_other_reason
    )
  ) stored,
  notes text,
  assessed_at date not null default current_date,
  updated_at timestamptz default now()
);

-- Progression tracking per client — same shape as weekly metrics, but
-- scoped to a client and date-stamped so a skill's progress over time
-- (e.g. "tuck planche: level 2" -> "level 3") is queryable.
create table if not exists client_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  name text not null,
  value numeric not null,
  unit text not null default 'level',
  recorded_at date not null default current_date,
  created_at timestamptz default now()
);

alter table clients enable row level security;
alter table parq_answers enable row level security;
alter table client_metrics enable row level security;

create policy "own clients" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own parq answers" on parq_answers
  for all using (
    exists (select 1 from clients where clients.id = parq_answers.client_id and clients.user_id = auth.uid())
  ) with check (
    exists (select 1 from clients where clients.id = parq_answers.client_id and clients.user_id = auth.uid())
  );

create policy "own client metrics" on client_metrics
  for all using (
    exists (select 1 from clients where clients.id = client_metrics.client_id and clients.user_id = auth.uid())
  ) with check (
    exists (select 1 from clients where clients.id = client_metrics.client_id and clients.user_id = auth.uid())
  );
