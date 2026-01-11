
-- Migration: SQL Schema Refinements for Multi-Tenancy and Data Integrity

-- 1. Enhance compliance_types (Work Types)
-- Add slug for URL-friendly lookup and ensure firm_id usage is clear
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'compliance_types' AND COLUMN_NAME = 'slug') THEN
        ALTER TABLE compliance_types ADD COLUMN slug text;
        
        -- Generate slugs for existing compliance types
        UPDATE compliance_types SET slug = lower(replace(name, ' ', '_')) WHERE slug IS NULL;
        
        -- Make it unique per firm (or global)
        CREATE UNIQUE INDEX idx_compliance_types_firm_slug ON compliance_types (firm_id, slug) WHERE firm_id IS NOT NULL;
        CREATE UNIQUE INDEX idx_compliance_types_global_slug ON compliance_types (slug) WHERE firm_id IS NULL;
    END IF;
END $$;

-- 2. Create client_work_types junction table
-- This allows a client to have multiple work types with proper relational tracking
CREATE TABLE IF NOT EXISTS client_work_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    work_type_id uuid NOT NULL REFERENCES compliance_types(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(client_id, work_type_id)
);

-- Enable RLS on client_work_types
ALTER TABLE client_work_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_work_types
CREATE POLICY "Users can read work types for clients in their firm"
    ON client_work_types FOR SELECT
    TO authenticated
    USING (firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Partners and managers can manage client work types"
    ON client_work_types FOR ALL
    TO authenticated
    USING (
        firm_id = (SELECT firm_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('partner', 'manager')
    );

-- 3. Improve Data Integrity on Clients
-- Ensure PAN and GSTIN are unique within a firm to prevent duplicate records
DO $$ 
BEGIN
    -- Add unique constraint for PAN per firm
    -- We use a partial index to allow nulls if PAN was not mandatory (though it usually is in this domain)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unique_clients_pan_firm') THEN
        CREATE UNIQUE INDEX idx_unique_clients_pan_firm ON clients (firm_id, pan);
    END IF;

    -- Add unique constraint for GSTIN per firm (GSTIN is often optional)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unique_clients_gstin_firm') THEN
        CREATE UNIQUE INDEX idx_unique_clients_gstin_firm ON clients (firm_id, gstin) WHERE gstin IS NOT NULL;
    END IF;
END $$;

-- 4. Add updated_at to compliance_types if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'compliance_types' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE compliance_types ADD COLUMN updated_at timestamptz DEFAULT now();
        
        CREATE TRIGGER update_compliance_types_updated_at BEFORE UPDATE ON compliance_types
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 5. Audit Logging for new table
CREATE TRIGGER audit_client_work_types_trigger
    AFTER INSERT OR UPDATE OR DELETE ON client_work_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 6. Commentary: Password and Auth handling
-- Note: Profiles/Users alignment with auth.users is already handled by the logic 
-- using auth.uid() in existing RLS and trigger functions. 
-- NO password field should be added to the public schema.
