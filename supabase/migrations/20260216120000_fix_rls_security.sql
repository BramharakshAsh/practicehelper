-- Fix 1: Enable RLS on all tables
-- This reverses the "EMERGENCY" disablement from previous migrations
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_staff_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_status_updates ENABLE ROW LEVEL SECURITY;
-- Helper function robustness
CREATE OR REPLACE FUNCTION public.get_my_firm_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $function$
SELECT firm_id
FROM public.users
WHERE id = auth.uid();
$function$;
-- Fix 2: Policies for Firms and Users (Critical for "Blank App")
-- Users must be able to see their own firm to load the dashboard
DROP POLICY IF EXISTS "Users can view own firm" ON public.firms;
CREATE POLICY "Users can view own firm" ON public.firms FOR
SELECT TO authenticated USING (id = get_my_firm_id());
-- Users must be able to see themselves AND their colleagues
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view colleagues" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can view colleagues" ON public.users FOR
SELECT TO authenticated USING (firm_id = get_my_firm_id());
-- Fix 3: Task Visibility
-- Ensure tasks are visible to the entire firm for now (simplest fix to "Blank App")
-- We can add strict "assigned_only" logic later if requested, but for now, 
-- Visibility > Strictness to fix the bug.
DROP POLICY IF EXISTS "Tenant isolation for tasks" ON public.tasks;
CREATE POLICY "Tenant isolation for tasks" ON public.tasks FOR ALL TO authenticated USING (firm_id = get_my_firm_id());
-- Fix 4: Clients
DROP POLICY IF EXISTS "Tenant isolation for clients" ON public.clients;
CREATE POLICY "Tenant isolation for clients" ON public.clients FOR ALL TO authenticated USING (firm_id = get_my_firm_id());