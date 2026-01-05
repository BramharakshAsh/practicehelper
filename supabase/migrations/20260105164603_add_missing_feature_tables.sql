
-- Migration to add missing feature tables: client_staff_relations, meetings, task_comments, task_status_updates

-- 1. Create Meeting Status Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
        CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled');
    END IF;
END $$;

-- 2. Client Staff Relations Table
CREATE TABLE IF NOT EXISTS client_staff_relations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(client_id, staff_id)
);

-- 3. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    location text,
    meeting_link text,
    status meeting_status DEFAULT 'scheduled',
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Task Status Updates Table
CREATE TABLE IF NOT EXISTS task_status_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status task_status NOT NULL,
    remarks text,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE client_staff_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_updates ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Client Staff Relations
CREATE POLICY "Users can read relations in their firm"
    ON client_staff_relations FOR SELECT
    TO authenticated
    USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage relations"
    ON client_staff_relations FOR ALL
    TO authenticated
    USING (
        firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
    );

-- Meetings
CREATE POLICY "Users can read meetings in their firm"
    ON meetings FOR SELECT
    TO authenticated
    USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage meetings they created or are assigned to"
    ON meetings FOR ALL
    TO authenticated
    USING (
        firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
        (created_by = auth.uid() OR staff_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager'))
    );

-- Task Comments
CREATE POLICY "Users can read comments for tasks in their firm"
    ON task_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_comments.task_id 
            AND tasks.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert comments for tasks in their firm"
    ON task_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_comments.task_id 
            AND tasks.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own comments"
    ON task_comments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Task Status Updates
CREATE POLICY "Users can read status updates for tasks in their firm"
    ON task_status_updates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_status_updates.task_id 
            AND tasks.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
        )
    );

-- 8. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_client_staff_relations_firm_id ON client_staff_relations(firm_id);
CREATE INDEX IF NOT EXISTS idx_meetings_firm_id ON meetings(firm_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_updates_task_id ON task_status_updates(task_id);

-- 9. Triggers for updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Audit Triggers
CREATE TRIGGER audit_meetings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON meetings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_task_comments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
