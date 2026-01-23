-- Migration: Client and Task Automation Enhancements
-- Date: 2026-01-20
-- 1. Update clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS client_group text;
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS to_remember text;
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS auto_mail_enabled boolean DEFAULT false;
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS mail_frequency text DEFAULT 'none';
-- 'monthly', 'quarterly', 'none'
-- 2. Update tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]';
-- We can keep checklist_progress for legacy or drop it later
-- 3. Create automation_logs table
CREATE TABLE IF NOT EXISTS automation_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    type text NOT NULL,
    -- 'task_generation', 'email_notification'
    status text NOT NULL,
    -- 'success', 'failed'
    details jsonb,
    created_at timestamptz DEFAULT now()
);
-- 4. Enable RLS on automation_logs
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can view all automation logs" ON automation_logs FOR
SELECT TO authenticated USING (
        auth.uid() IN (
            SELECT id
            FROM users
            WHERE role = 'partner'
                AND firm_id = automation_logs.firm_id
        )
    );