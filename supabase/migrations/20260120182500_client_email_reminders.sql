-- Migration: Client Email Reminders
-- Description: Creates tables for email templates and client email schedules
-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    template_type text NOT NULL CHECK (
        template_type IN ('reminder', 'invoice', 'general')
    ),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Client email schedules table
CREATE TABLE IF NOT EXISTS client_email_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    template_id uuid NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    schedule_day integer NOT NULL CHECK (
        schedule_day >= 1
        AND schedule_day <= 31
    ),
    frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    is_active boolean DEFAULT true,
    last_sent_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Indexes
CREATE INDEX idx_email_templates_firm ON email_templates(firm_id);
CREATE INDEX idx_email_schedules_firm ON client_email_schedules(firm_id);
CREATE INDEX idx_email_schedules_active ON client_email_schedules(is_active)
WHERE is_active = true;
-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_email_schedules ENABLE ROW LEVEL SECURITY;
-- RLS Policies for email_templates
CREATE POLICY "Users can view their firm's email templates" ON email_templates FOR
SELECT USING (
        firm_id = (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
    );
CREATE POLICY "Partners and managers can create email templates" ON email_templates FOR
INSERT WITH CHECK (
        firm_id = (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
        AND (
            SELECT role
            FROM users
            WHERE id = auth.uid()
        ) IN ('partner', 'manager')
    );
CREATE POLICY "Partners and managers can update email templates" ON email_templates FOR
UPDATE USING (
        firm_id = (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
        AND (
            SELECT role
            FROM users
            WHERE id = auth.uid()
        ) IN ('partner', 'manager')
    );
CREATE POLICY "Partners and managers can delete email templates" ON email_templates FOR DELETE USING (
    firm_id = (
        SELECT firm_id
        FROM users
        WHERE id = auth.uid()
    )
    AND (
        SELECT role
        FROM users
        WHERE id = auth.uid()
    ) IN ('partner', 'manager')
);
-- RLS Policies for client_email_schedules
CREATE POLICY "Users can view their firm's email schedules" ON client_email_schedules FOR
SELECT USING (
        firm_id = (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
    );
CREATE POLICY "Partners and managers can create email schedules" ON client_email_schedules FOR
INSERT WITH CHECK (
        firm_id = (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
        AND (
            SELECT role
            FROM users
            WHERE id = auth.uid()
        ) IN ('partner', 'manager')
    );
CREATE POLICY "Partners and managers can update email schedules" ON client_email_schedules FOR
UPDATE USING (
        firm_id = (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
        AND (
            SELECT role
            FROM users
            WHERE id = auth.uid()
        ) IN ('partner', 'manager')
    );
CREATE POLICY "Partners and managers can delete email schedules" ON client_email_schedules FOR DELETE USING (
    firm_id = (
        SELECT firm_id
        FROM users
        WHERE id = auth.uid()
    )
    AND (
        SELECT role
        FROM users
        WHERE id = auth.uid()
    ) IN ('partner', 'manager')
);
-- Comments
COMMENT ON TABLE email_templates IS 'Email templates for automated client communications';
COMMENT ON TABLE client_email_schedules IS 'Scheduled email configurations for clients';