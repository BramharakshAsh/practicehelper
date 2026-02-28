-- Migration: Create Task Closures table
CREATE TABLE IF NOT EXISTS task_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (
        action_type IN (
            'no_change',
            'blocked',
            'waiting_client',
            'progress'
        )
    ),
    remarks TEXT,
    old_status TEXT,
    new_status TEXT,
    old_completion_percentage INTEGER,
    new_completion_percentage INTEGER
);
-- Index for efficient querying by firm and date
CREATE INDEX IF NOT EXISTS idx_task_closures_firm_date ON task_closures(firm_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_closures_staff_date ON task_closures(staff_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_closures_task_id ON task_closures(task_id);
-- Apply RLS
ALTER TABLE task_closures ENABLE ROW LEVEL SECURITY;
-- Staff can view firm closures
CREATE POLICY "Firm users can view closures" ON task_closures FOR
SELECT USING (
        firm_id IN (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
    );
-- Staff can insert their own closures
CREATE POLICY "Staff can insert their own closures" ON task_closures FOR
INSERT WITH CHECK (
        staff_id = auth.uid()
        AND firm_id IN (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
    );