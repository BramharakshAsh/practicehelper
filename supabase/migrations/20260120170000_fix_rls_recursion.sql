-- Fix RLS Recursion and redundant policies
-- 1. Helper Functions (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_firm_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $function$
SELECT firm_id
FROM public.users
WHERE id = auth.uid();
$function$;
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $function$
SELECT role
FROM public.users
WHERE id = auth.uid();
$function$;
-- 2. Clean up USERS table policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for anyone" ON public.users;
DROP POLICY IF EXISTS "Firm isolation for all operations" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read same firm profiles" ON public.users;
DROP POLICY IF EXISTS "Users can see own profile" ON public.users;
DROP POLICY IF EXISTS "user_admin_manage_policy" ON public.users;
DROP POLICY IF EXISTS "user_select_policy" ON public.users;
DROP POLICY IF EXISTS "user_self_update_policy" ON public.users;
DROP POLICY IF EXISTS "Tenant isolation for users" ON public.users;
-- Standardized USERS policies
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view colleagues" ON public.users FOR
SELECT USING (firm_id = get_my_firm_id());
CREATE POLICY "Admins can manage firm users" ON public.users FOR ALL USING (
    get_my_role() IN ('partner', 'manager')
    AND firm_id = get_my_firm_id()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- 3. Update FIRMS policy
DROP POLICY IF EXISTS "Users can read own firm" ON public.firms;
DROP POLICY IF EXISTS "Tenant isolation for firms" ON public.firms;
CREATE POLICY "Tenant isolation for firms" ON public.firms FOR
SELECT USING (id = get_my_firm_id());
-- 4. Clean up other tables to use the helper function
-- Tasks
DROP POLICY IF EXISTS "task_admin_delete_policy" ON public.tasks;
DROP POLICY IF EXISTS "task_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "task_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "Tenant isolation for tasks" ON public.tasks;
CREATE POLICY "Tenant isolation for tasks" ON public.tasks FOR ALL USING (firm_id = get_my_firm_id());
-- Clients
DROP POLICY IF EXISTS "Tenant isolation for clients" ON public.clients;
CREATE POLICY "Tenant isolation for clients" ON public.clients FOR ALL USING (firm_id = get_my_firm_id());
-- Meetings
DROP POLICY IF EXISTS "Tenant isolation for meetings" ON public.meetings;
CREATE POLICY "Tenant isolation for meetings" ON public.meetings FOR ALL USING (firm_id = get_my_firm_id());
-- Staff
DROP POLICY IF EXISTS "Tenant isolation for staff" ON public.staff;
CREATE POLICY "Tenant isolation for staff" ON public.staff FOR ALL USING (firm_id = get_my_firm_id());
-- Compliance Types
DROP POLICY IF EXISTS "Tenant isolation for compliance" ON public.compliance_types;
CREATE POLICY "Tenant isolation for compliance" ON public.compliance_types FOR ALL USING (
    firm_id IS NULL
    OR firm_id = get_my_firm_id()
);