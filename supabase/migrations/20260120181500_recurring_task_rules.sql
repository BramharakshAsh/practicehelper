-- Migration: Add recurring task rules functionality
-- Description: Creates tables and functions for scheduling recurring tasks
-- Create recurring_task_rules table
CREATE TABLE IF NOT EXISTS recurring_task_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    compliance_type_id uuid REFERENCES compliance_types(id) ON DELETE
    SET NULL,
        client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
        staff_id uuid REFERENCES users(id) ON DELETE
    SET NULL,
        title text NOT NULL,
        description text,
        priority task_priority DEFAULT 'medium',
        execution_day integer NOT NULL CHECK (
            execution_day >= 1
            AND execution_day <= 31
        ),
        frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
        is_active boolean DEFAULT true,
        last_generated_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
);
-- Create index for efficient queries
CREATE INDEX idx_recurring_rules_firm ON recurring_task_rules(firm_id);
CREATE INDEX idx_recurring_rules_active ON recurring_task_rules(is_active)
WHERE is_active = true;
CREATE INDEX idx_recurring_rules_execution_day ON recurring_task_rules(execution_day);
-- Enable RLS
ALTER TABLE recurring_task_rules ENABLE ROW LEVEL SECURITY;
-- RLS Policies
CREATE POLICY "Users can view their firm's recurring rules" ON recurring_task_rules FOR
SELECT USING (
        firm_id = (
            SELECT firm_id
            FROM users
            WHERE id = auth.uid()
        )
    );
CREATE POLICY "Partners and managers can create recurring rules" ON recurring_task_rules FOR
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
CREATE POLICY "Partners and managers can update recurring rules" ON recurring_task_rules FOR
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
CREATE POLICY "Partners and managers can delete recurring rules" ON recurring_task_rules FOR DELETE USING (
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
-- Function to get next generation date for a rule
CREATE OR REPLACE FUNCTION get_next_generation_date(
        p_execution_day integer,
        p_frequency text,
        p_last_generated_at timestamptz DEFAULT NULL
    ) RETURNS date LANGUAGE plpgsql AS $$
DECLARE v_base_date date;
v_result_date date;
BEGIN -- Use last generated date or current date as base
v_base_date := COALESCE(p_last_generated_at::date, CURRENT_DATE);
CASE
    p_frequency
    WHEN 'monthly' THEN -- Next month on execution day
    v_result_date := (v_base_date + interval '1 month')::date;
v_result_date := make_date(
    EXTRACT(
        year
        FROM v_result_date
    )::int,
    EXTRACT(
        month
        FROM v_result_date
    )::int,
    LEAST(
        p_execution_day,
        EXTRACT(
            days
            FROM (v_result_date + interval '1 month - 1 day')
        )::int
    )
);
WHEN 'quarterly' THEN -- Next quarter on execution day
v_result_date := (v_base_date + interval '3 months')::date;
v_result_date := make_date(
    EXTRACT(
        year
        FROM v_result_date
    )::int,
    EXTRACT(
        month
        FROM v_result_date
    )::int,
    LEAST(
        p_execution_day,
        EXTRACT(
            days
            FROM (v_result_date + interval '1 month - 1 day')
        )::int
    )
);
WHEN 'yearly' THEN -- Next year on execution day
v_result_date := (v_base_date + interval '1 year')::date;
v_result_date := make_date(
    EXTRACT(
        year
        FROM v_result_date
    )::int,
    EXTRACT(
        month
        FROM v_result_date
    )::int,
    LEAST(
        p_execution_day,
        EXTRACT(
            days
            FROM (v_result_date + interval '1 month - 1 day')
        )::int
    )
);
END CASE
;
RETURN v_result_date;
END;
$$;
-- Add comment
COMMENT ON TABLE recurring_task_rules IS 'Stores rules for automatically generating recurring tasks';