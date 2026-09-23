-- Migration: replace all fixed movement/mobility fields with a fully
-- custom list. Additive column on movement_findings (now doubling as
-- "movement checks"), plus dropping the fixed columns from
-- movement_screens since the app no longer reads or writes them.
-- Baseline strength (max pull-ups/push-ups/dips/squat reps) moves to
-- the existing client_metrics table instead of duplicating it here —
-- log it as a dated progression entry.
-- Safe given schema.sql/001-004 are the only consumers and this
-- project has no external clients of the old shape.

alter table movement_findings add column if not exists restricted boolean not null default false;

alter table movement_screens drop column if exists shoulder_overhead_restricted;
alter table movement_screens drop column if exists wrist_extension_restricted;
alter table movement_screens drop column if exists ankle_hip_restricted;
alter table movement_screens drop column if exists max_pull_ups;
alter table movement_screens drop column if exists max_push_ups;
alter table movement_screens drop column if exists max_dips;
alter table movement_screens drop column if exists max_squat_reps;
