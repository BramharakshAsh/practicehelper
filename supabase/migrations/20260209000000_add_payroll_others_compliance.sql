-- Add Payroll Processing and Others compliance types
-- This migration adds the missing global compliance types
INSERT INTO compliance_types (
        name,
        code,
        category,
        frequency,
        due_day,
        is_active
    )
VALUES (
        'Payroll Processing',
        'PAYROLL',
        'Payroll',
        'monthly',
        7,
        true
    ),
    (
        'Others',
        'OTHERS',
        'Others',
        'as_needed',
        NULL,
        true
    ) ON CONFLICT DO NOTHING;