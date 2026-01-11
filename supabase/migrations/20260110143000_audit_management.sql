-- Audit Management Migration

-- 1. Create audit_plans table
CREATE TABLE IF NOT EXISTS audit_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  progress decimal(5,2) DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create audit_checklist_items table (Hierarchical)
CREATE TABLE IF NOT EXISTS audit_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES audit_plans(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES audit_checklist_items(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  target_date date,
  is_completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create audit_plan_templates table
CREATE TABLE IF NOT EXISTS audit_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE, -- Nullable for global presets
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create audit_template_items table
CREATE TABLE IF NOT EXISTS audit_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES audit_plan_templates(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES audit_template_items(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Add audit_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS audit_id uuid REFERENCES audit_plans(id) ON DELETE SET NULL;

-- 6. Enable RLS
ALTER TABLE audit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_items ENABLE ROW LEVEL SECURITY;

-- 7. Policies
CREATE POLICY "Tenant isolation for audit_plans" ON audit_plans FOR ALL TO authenticated USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for audit_items" ON audit_checklist_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM audit_plans WHERE audit_plans.id = audit_checklist_items.audit_id AND audit_plans.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Tenant isolation for audit_templates" ON audit_plan_templates FOR ALL TO authenticated USING (firm_id IS NULL OR firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for audit_template_items" ON audit_template_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM audit_plan_templates WHERE audit_plan_templates.id = audit_template_items.template_id AND (audit_plan_templates.firm_id IS NULL OR audit_plan_templates.firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()))));

-- 8. Triggers for updated_at
CREATE TRIGGER update_audit_plans_updated_at BEFORE UPDATE ON audit_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_checklist_items_updated_at BEFORE UPDATE ON audit_checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_plan_templates_updated_at BEFORE UPDATE ON audit_plan_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Progress Roll-up Function
CREATE OR REPLACE FUNCTION update_audit_progress()
RETURNS TRIGGER AS $$
DECLARE
  audit_id_val uuid;
  total_items int;
  completed_items int;
  new_progress decimal(5,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    audit_id_val := OLD.audit_id;
  ELSE
    audit_id_val := NEW.audit_id;
  END IF;

  -- Only count leaf nodes (items without children) for progress
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO total_items, completed_items
  FROM audit_checklist_items
  WHERE audit_id = audit_id_val
  AND NOT EXISTS (
    SELECT 1 FROM audit_checklist_items sub 
    WHERE sub.parent_id = audit_checklist_items.id
  );

  IF total_items > 0 THEN
    new_progress := (completed_items::decimal / total_items::decimal) * 100;
  ELSE
    new_progress := 0;
  END IF;

  UPDATE audit_plans 
  SET progress = new_progress,
      status = CASE WHEN new_progress = 100 THEN 'completed' ELSE status END,
      updated_at = now()
  WHERE id = audit_id_val;

  -- Sync with tasks
  IF new_progress = 100 THEN
    UPDATE tasks 
    SET status = 'filed_completed', 
        updated_at = now() 
    WHERE audit_id = audit_id_val;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_progress
AFTER INSERT OR UPDATE OF is_completed OR DELETE ON audit_checklist_items
FOR EACH ROW EXECUTE FUNCTION update_audit_progress();
