-- Step 1: Add new engagement control columns to public.tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS last_closure_at timestamptz,
    ADD COLUMN IF NOT EXISTS is_unreported boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS due_date_modifications integer DEFAULT 0;
-- Step 2: Add tracking columns to public.users and public.staff
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS unreported_days_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS login_blocked boolean DEFAULT false;
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS unreported_days_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS login_blocked boolean DEFAULT false;
-- Step 3: Create public.daily_firm_health table
CREATE TABLE IF NOT EXISTS public.daily_firm_health (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id uuid NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    date date NOT NULL,
    total_score numeric(5, 2) NOT NULL,
    reporting_score numeric(5, 2) NOT NULL,
    deadline_score numeric(5, 2) NOT NULL,
    dependency_score numeric(5, 2) NOT NULL,
    stability_score numeric(5, 2) NOT NULL,
    biggest_impact_factor text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(firm_id, date)
);
-- Step 4: Enable RLS and create policies for daily_firm_health
ALTER TABLE public.daily_firm_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for daily_firm_health" ON public.daily_firm_health FOR ALL TO authenticated USING (firm_id = public.get_my_firm_id());
-- Step 5: Add Indexes for performance calculation
CREATE INDEX IF NOT EXISTS idx_daily_firm_health_firm_date ON public.daily_firm_health(firm_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_unreported ON public.tasks(is_unreported)
WHERE is_unreported = true;