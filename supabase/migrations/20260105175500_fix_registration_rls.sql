
-- Migration: Robust Fix for Registration RLS

-- 1. Allow firm creation by ANYONE (to support the signup process where user context might be delayed)
-- We use TO anon, authenticated to be safe
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON firms;
DROP POLICY IF EXISTS "Enable insert for anyone" ON firms;
CREATE POLICY "Enable insert for anyone" 
    ON firms FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- 2. Allow user profile creation by ANYONE
DROP POLICY IF EXISTS "Enable insert for users" ON users;
DROP POLICY IF EXISTS "Enable insert for anyone" ON users;
CREATE POLICY "Enable insert for anyone" 
    ON users FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- 3. Ensure users can see their own profile even if firm_id is not yet set in the session
-- This fixes potential fetch errors right after signup
DROP POLICY IF EXISTS "Users can read profiles in their firm" ON users;
CREATE POLICY "Users can read profiles in their firm"
    ON users FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() OR 
        firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    );

-- 4. Allow reading firms for selection if needed (Optional)
DROP POLICY IF EXISTS "Users can read own firm" ON firms;
CREATE POLICY "Users can read own firm" 
    ON firms FOR SELECT 
    TO authenticated 
    USING (id = (SELECT firm_id FROM users WHERE id = auth.uid()) OR id IN (SELECT firm_id FROM users WHERE id = auth.uid()));
