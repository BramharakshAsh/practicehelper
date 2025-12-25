/*
  # Core Collaboration: Meetings & Comments

  1. New Tables
    - `meetings`
      - Stores scheduled calls/meetings between staff and clients
      - Integated with firm_id for multi-tenancy
    - `task_comments`
      - Stores updates/comments on tasks
      - Linked to tasks and users

  2. Security
    - Enable RLS on both tables
    - Policies for reading and managing based on firm_id and roles
*/

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text, -- Physical location or URL
  meeting_link text, -- Specifically for video calls
  status text DEFAULT 'scheduled', -- scheduled, completed, cancelled
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meetings_firm_id ON meetings(firm_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_staff_id ON meetings(staff_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Users can read meetings in their firm"
  ON meetings
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
  );

CREATE POLICY "Staff can manage their own meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    staff_id = auth.uid()
  );

-- RLS Policies for task_comments
CREATE POLICY "Users can read comments for tasks they can see"
  ON task_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create comments on tasks they can see"
  ON task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for audit logs
CREATE TRIGGER audit_meetings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON meetings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_task_comments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
