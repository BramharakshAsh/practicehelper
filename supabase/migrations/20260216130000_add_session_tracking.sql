-- Add a column to track the active session ID for a user
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS current_session_id text;
-- Index it for potential lookups (though we mostly access by ID)
CREATE INDEX IF NOT EXISTS idx_users_session_id ON public.users(current_session_id);
-- Ensure RLS allows users to update their own session ID (implicitly covered by "Users can view own profile" if we change it to ALL or add an UPDATE policy)
-- But let's be explicit for safety.
CREATE POLICY "Users can update own session" ON public.users FOR
UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());