-- Migration to add subscription support to firms
-- Handles Free vs Growth tiers and usage tracking
-- 1. Add subscription columns to firms table
ALTER TABLE firms
ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'growth')),
    ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active' CHECK (
        subscription_status IN ('active', 'inactive', 'past_due')
    ),
    ADD COLUMN IF NOT EXISTS custom_user_limit integer,
    -- Overrides tier defaults if not null
ADD COLUMN IF NOT EXISTS custom_client_limit integer,
    -- Overrides tier defaults if not null
ADD COLUMN IF NOT EXISTS excel_imports_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_auto_task_run_at timestamptz,
    ADD COLUMN IF NOT EXISTS subscription_updated_at timestamptz DEFAULT now();
-- 2. Add audit helper function to count audits created in current month
-- (This will be used by the application, or we can use a direct count query)
-- 3. Update existing firms to have defaults
UPDATE firms
SET subscription_tier = 'free',
    excel_imports_count = 0
WHERE subscription_tier IS NULL;