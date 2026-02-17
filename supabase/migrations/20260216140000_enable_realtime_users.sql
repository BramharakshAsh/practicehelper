-- Enable Realtime for users table so the client receives UPDATE events
-- This is required for Single Session Enforcement to work (kicking out old sessions)
begin;
-- Check if publication exists, if not create it (standard Supabase setup usually has it)
-- allow the table to be replicated
alter publication supabase_realtime
add table public.users;
commit;