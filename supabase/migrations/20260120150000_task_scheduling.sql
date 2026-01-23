-- Migration: Add scheduling support to tasks
-- Date: 2026-01-20
-- 1. Update task_status enum to include 'scheduled'
-- Note: In Postgres, adding values to an enum cannot be done inside a transaction block easily.
-- Supabase handles this well in migrations.
ALTER TYPE task_status
ADD VALUE IF NOT EXISTS 'scheduled';
-- 2. Add scheduled_for column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS scheduled_for date;
-- 3. Add index for performance on scheduled tasks
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_for ON tasks(scheduled_for)
WHERE status = 'scheduled';
-- 4. Function to 'activate' scheduled tasks (can be called by a cron)
CREATE OR REPLACE FUNCTION activate_scheduled_tasks() RETURNS integer AS $$
DECLARE count integer;
BEGIN
UPDATE tasks
SET status = 'assigned',
    updated_at = now()
WHERE status = 'scheduled'
    AND scheduled_for <= CURRENT_DATE;
GET DIAGNOSTICS count = ROW_COUNT;
RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;