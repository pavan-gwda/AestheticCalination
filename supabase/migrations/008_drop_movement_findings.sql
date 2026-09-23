-- Migration: drop movement_findings.
-- Superseded by movement_screen_metrics (Current movements & metrics),
-- which already covers mobility via its "Mobility" category. The app
-- no longer reads or writes this table.

drop table if exists movement_findings;
