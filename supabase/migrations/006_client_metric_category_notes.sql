-- Migration: category + notes on progression entries.
-- Additive only. category groups entries in the UI (Strength/Mobility/
-- Cardio/Other); notes holds limitations or assessment text for that
-- specific entry.

alter table client_metrics add column if not exists category text not null default 'Other';
alter table client_metrics add column if not exists notes text;
