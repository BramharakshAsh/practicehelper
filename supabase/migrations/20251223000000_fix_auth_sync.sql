/*
  # Fix Auth Sync
  
  This script manually creates entries in `auth.users` that match the existing `public.users` 
  created by the previous seed script. This is necessary because RLS policies rely on 
  Supabase Auth (`auth.uid()`), but the seed script only populated `public.users`.
  
  WARNING: This should only be run ONCE to fix the development environment.
*/

DO $$
DECLARE
    v_admin_id uuid;
    v_manager_id uuid;
    v_staff1_id uuid;
    v_staff2_id uuid;
    v_password_hash text;
BEGIN
    -- 1. Sync ADMIN (Partner)
    SELECT id INTO v_admin_id FROM public.users WHERE email = 'admin@democaassociates.com';
    IF v_admin_id IS NOT NULL THEN
        -- Generate hash for 'admin123'
        v_password_hash := crypt('admin123', gen_salt('bf'));
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated', 'admin@democaassociates.com', v_password_hash,
            now(), '{"provider":"email","providers":["email"]}', '{}',
            now(), now()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 2. Sync MANAGER
    SELECT id INTO v_manager_id FROM public.users WHERE email = 'manager@democaassociates.com';
    IF v_manager_id IS NOT NULL THEN
        v_password_hash := crypt('manager123', gen_salt('bf'));
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_manager_id, 'authenticated', 'authenticated', 'manager@democaassociates.com', v_password_hash,
            now(), '{"provider":"email","providers":["email"]}', '{}',
            now(), now()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 3. Sync STAFF 1
    SELECT id INTO v_staff1_id FROM public.users WHERE email = 'staff@democaassociates.com';
    IF v_staff1_id IS NOT NULL THEN
        v_password_hash := crypt('staff123', gen_salt('bf'));
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_staff1_id, 'authenticated', 'authenticated', 'staff@democaassociates.com', v_password_hash,
            now(), '{"provider":"email","providers":["email"]}', '{}',
            now(), now()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 4. Sync STAFF 2
    SELECT id INTO v_staff2_id FROM public.users WHERE email = 'staff2@democaassociates.com';
    IF v_staff2_id IS NOT NULL THEN
        v_password_hash := crypt('staff123', gen_salt('bf'));
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_staff2_id, 'authenticated', 'authenticated', 'staff2@democaassociates.com', v_password_hash,
            now(), '{"provider":"email","providers":["email"]}', '{}',
            now(), now()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

END $$;
