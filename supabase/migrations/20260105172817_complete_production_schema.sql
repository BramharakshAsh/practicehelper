
-- Complete Production Database Schema for Practice Helper SaaS
-- Includes Multi-Tenancy (RLS), Auditing, and feature-specific extensions.

-- ==========================================
-- 1. Extensions & Custom Types
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('partner', 'manager', 'staff', 'paid_staff', 'articles');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('assigned', 'in_progress', 'awaiting_client_data', 'ready_for_review', 'filed_completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_frequency') THEN
        CREATE TYPE compliance_frequency AS ENUM ('monthly', 'quarterly', 'yearly', 'as_needed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'assign', 'status_change');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
        CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled');
    END IF;
END $$;

-- ==========================================
-- 2. Automation Functions
-- ==========================================

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit Log Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  firm_id_val uuid;
  user_id_val uuid;
BEGIN
  -- Attempt to get firm_id and user_id from auth context
  SELECT firm_id INTO firm_id_val FROM users WHERE id = auth.uid();
  user_id_val := auth.uid();
  
  INSERT INTO audit_logs (
    firm_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id
  ) VALUES (
    firm_id_val,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP
      WHEN 'INSERT' THEN 'create'::audit_action
      WHEN 'UPDATE' THEN 'update'::audit_action
      WHEN 'DELETE' THEN 'delete'::audit_action
    END,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    user_id_val
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. Core Tables
-- ==========================================

-- Firms table
CREATE TABLE IF NOT EXISTS firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pan text UNIQUE,
  gstin text UNIQUE,
  email text,
  contact_number text,
  website text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users (Profiles) table referencing Supabase Auth
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  phone text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff details (Extension of users)
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  employee_id text,
  department text,
  specializations text[] DEFAULT '{}',
  hourly_rate decimal(10,2),
  is_available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  date_of_joining date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance Types (Work Types)
CREATE TABLE IF NOT EXISTS compliance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE, -- Nullable for global types
  category text, -- 'GST', 'Income Tax', etc.
  name text NOT NULL,
  code text NOT NULL,
  slug text,
  description text,
  frequency compliance_frequency DEFAULT 'monthly',
  due_day integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  gstin text,
  pan text NOT NULL,
  email text,
  phone text,
  address text,
  work_types text[] DEFAULT '{}', -- Kept for compatibility, junction table preferred
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  compliance_type_id uuid REFERENCES compliance_types(id) ON DELETE SET NULL,
  template_id uuid, -- Reference to task_templates if applicable
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  status task_status DEFAULT 'assigned',
  priority task_priority DEFAULT 'medium',
  period text,
  remarks text,
  delay_reason text,
  estimated_hours integer,
  actual_hours integer,
  checklist_progress jsonb DEFAULT '{}',
  assigned_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 4. Feature Extensions
-- ==========================================

-- Client Staff Relations (Ownership mapping)
CREATE TABLE IF NOT EXISTS client_staff_relations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(client_id, staff_id)
);

-- Client Work Types (Linkage table)
CREATE TABLE IF NOT EXISTS client_work_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    work_type_id uuid NOT NULL REFERENCES compliance_types(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(client_id, work_type_id)
);

-- Meetings
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

-- Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Task Status Updates (History)
CREATE TABLE IF NOT EXISTS task_status_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status task_status NOT NULL,
    remarks text,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action audit_action NOT NULL,
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES users(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 5. Indexes & Constraints
-- ==========================================

-- Multi-Tenant Uniqueness on Clients
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_clients_pan_firm ON clients (firm_id, pan);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_clients_gstin_firm ON clients (firm_id, gstin) WHERE gstin IS NOT NULL;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_firm_client ON tasks(firm_id, client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_staff_due ON tasks(staff_id, due_date);
CREATE INDEX IF NOT EXISTS idx_audit_firm_table ON audit_logs(firm_id, table_name);

-- ==========================================
-- 6. Row Level Security (RLS)
-- ==========================================
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_staff_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_work_types ENABLE ROW LEVEL SECURITY;

-- Generic Isolation Policy (Simplified for standard multi-tenancy)
-- Note: Replace (SELECT firm_id FROM users WHERE id = auth.uid()) with a cached function in high-performance production.

-- Firms (Read own firm)
CREATE POLICY "Users can read own firm" ON firms FOR SELECT TO authenticated USING (id = (SELECT firm_id FROM users WHERE id = auth.uid()));

-- Global Policy Template for tenant tables
CREATE POLICY "Tenant isolation for users" ON users FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for clients" ON clients FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for staff" ON staff FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for compliance" ON compliance_types FOR ALL TO authenticated USING (firm_id IS NULL OR firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for tasks" ON tasks FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for meetings" ON meetings FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for comments" ON task_comments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Tenant isolation for relations" ON client_staff_relations FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for work_types" ON client_work_types FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for audit" ON audit_logs FOR SELECT TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

-- ==========================================
-- 7. Triggers
-- ==========================================

-- updated_at triggers
CREATE TRIGGER update_firms_updated_at BEFORE UPDATE ON firms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_types_updated_at BEFORE UPDATE ON compliance_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit Triggers
CREATE TRIGGER audit_clients_trigger AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_tasks_trigger AFTER INSERT OR UPDATE OR DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_meetings_trigger AFTER INSERT OR UPDATE OR DELETE ON meetings FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_staff_trigger AFTER INSERT OR UPDATE OR DELETE ON staff FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
