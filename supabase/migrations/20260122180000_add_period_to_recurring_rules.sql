-- Migration: Add period column to recurring task rules
-- Description: Adds period field for quarterly/yearly task tracking (e.g., "Q1 FY2024")

ALTER TABLE recurring_task_rules 
ADD COLUMN IF NOT EXISTS period text;

COMMENT ON COLUMN recurring_task_rules.period IS 'Period identifier for the task (e.g., "Q1 FY2024", "FY2024-25")';
