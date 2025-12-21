
/*
  # Production CA Practice Management Schema

  1. New Tables
    - `firms` - Multi-tenant firm isolation
    - `users` - User management with roles and firm association
    - `clients` - Client information with firm isolation
    - `staff` - Staff members with availability tracking
    - `compliance_types` - Compliance work types
    - `tasks` - Task management with full audit trail
    - `task_templates` - Reusable task templates
    - `staff_availability` - Staff calendar and availability
    - `audit_logs` - Complete audit trail for all operations

  2. Security
    - Enable RLS on all tables
    - Firm-level data isolation
    - Role-based access control (Partner, Manager, Staff)
    - Audit logging for all critical operations

  3. Features
    - Multi-tenant architecture
    - Comprehensive audit trail
    - Staff availability management
    - Task templates for automation
    - Role-based permissions
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('partner', 'manager', 'staff');
CREATE TYPE task_status AS ENUM ('assigned', 'in_progress', 'awaiting_client_data', 'ready_for_review', 'filed_completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE compliance_frequency AS ENUM ('monthly', 'quarterly', 'yearly', 'as_needed');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'assign', 'status_change');

-- Firms table (multi-tenant)
CREATE TABLE IF NOT EXISTS firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_number text,
  address text,
  phone text,
  email text,
  website text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table with firm association
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  phone text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  gstin text,
  pan text NOT NULL,
  email text,
  phone text,
  address text,
  work_types text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff table (extends users for staff-specific data)
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  employee_id text,
  department text,
  specializations text[] DEFAULT '{}',
  hourly_rate decimal(10,2),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance types
CREATE TABLE IF NOT EXISTS compliance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  frequency compliance_frequency NOT NULL DEFAULT 'monthly',
  due_day integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Task templates for automation
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  compliance_type_id uuid REFERENCES compliance_types(id),
  default_priority task_priority DEFAULT 'medium',
  estimated_hours integer,
  checklist_items jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id),
  compliance_type_id uuid REFERENCES compliance_types(id),
  template_id uuid REFERENCES task_templates(id),
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

-- Staff availability
CREATE TABLE IF NOT EXISTS staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true,
  availability_type text, -- 'full_day', 'half_day', 'unavailable', 'meeting'
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- Audit logs
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_firm_id ON users(firm_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_firm_id ON clients(firm_id);
CREATE INDEX IF NOT EXISTS idx_clients_pan ON clients(pan);
CREATE INDEX IF NOT EXISTS idx_staff_firm_id ON staff(firm_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_firm_id ON tasks(firm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_staff_id ON tasks(staff_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_date ON staff_availability(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_firm_id ON audit_logs(firm_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Enable Row Level Security
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for firms
CREATE POLICY "Users can read their own firm"
  ON firms
  FOR SELECT
  TO authenticated
  USING (id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners can update their firm"
  ON firms
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'partner'
  );

-- RLS Policies for users
CREATE POLICY "Users can read users in their firm"
  ON users
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
  );

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for clients
CREATE POLICY "Users can read clients in their firm"
  ON clients
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
  );

-- RLS Policies for staff
CREATE POLICY "Users can read staff in their firm"
  ON staff
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage staff"
  ON staff
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
  );

-- RLS Policies for compliance_types
CREATE POLICY "Users can read compliance types in their firm"
  ON compliance_types
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage compliance types"
  ON compliance_types
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
  );

-- RLS Policies for task_templates
CREATE POLICY "Users can read task templates in their firm"
  ON task_templates
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage task templates"
  ON task_templates
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
  );

-- RLS Policies for tasks
CREATE POLICY "Users can read tasks in their firm"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update their assigned tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (staff_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager'))
  );

CREATE POLICY "Partners and managers can manage all tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
  );

-- RLS Policies for staff_availability
CREATE POLICY "Users can read availability in their firm"
  ON staff_availability
  FOR SELECT
  TO authenticated
  USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can manage their own availability"
  ON staff_availability
  FOR ALL
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (staff_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager'))
  );

-- RLS Policies for audit_logs
CREATE POLICY "Partners can read all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'partner'
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  firm_id_val uuid;
  user_id_val uuid;
BEGIN
  -- Get current user's firm_id
  SELECT firm_id INTO firm_id_val FROM users WHERE id = auth.uid();
  user_id_val := auth.uid();
  
  -- Insert audit log
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

-- Create audit triggers
CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_tasks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_staff_trigger
  AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert default compliance types
INSERT INTO compliance_types (firm_id, name, code, frequency, due_day) VALUES
  (NULL, 'GST Return', 'GST', 'monthly', 20),
  (NULL, 'TDS Return', 'TDS', 'monthly', 7),
  (NULL, 'Income Tax Return', 'ITR', 'yearly', 31),
  (NULL, 'ROC Filing', 'ROC', 'yearly', 30),
  (NULL, 'Audit Report', 'AUDIT', 'yearly', 30),
  (NULL, 'Accounting', 'ACCOUNTING', 'monthly', 10)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_firms_updated_at BEFORE UPDATE ON firms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
