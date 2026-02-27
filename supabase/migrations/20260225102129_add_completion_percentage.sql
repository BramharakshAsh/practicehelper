-- Add completion_percentage to tasks table
ALTER TABLE tasks
ADD COLUMN completion_percentage INTEGER DEFAULT 0 CHECK (
        completion_percentage >= 0
        AND completion_percentage <= 100
    );
-- Update the audit log trigger to capture changes to this new field if needed
-- (Assuming the generic audit trigger automatically captures all columns)