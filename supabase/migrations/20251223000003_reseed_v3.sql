/*
  # FINAL RESEED SCRIPT (V3)
  # Purpose: Safely WIPE and RE-POPULATE the database.
  # This script handles missing tables and existing auth users gracefully.
  
  # INSTRUCTIONS: Run this ENTIRE SCRIPT in the Supabase SQL Editor.
*/

DO $$
DECLARE
    -- Fixed IDs for consistency
    demo_firm_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    partner_id uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    manager_id uuid := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    staff1_id uuid := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    staff2_id uuid := 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';
    
    client1_id uuid := 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';

    -- Emails
    admin_email text := 'admin@democaassociates.com';
    manager_email text := 'manager@democaassociates.com';
    staff1_email text := 'staff@democaassociates.com';
    staff2_email text := 'staff2@democaassociates.com';
BEGIN
    RAISE NOTICE 'Starting Reseed Process...';

    -- 1. SAFE CLEANUP (Public Schema)
    -- We delete data instead of Truncate to avoid cascading issues if tables are missing
    -- Using dynamic SQL to avoid "relation does not exist" errors at parse time
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        EXECUTE 'DELETE FROM task_comments';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meetings') THEN
        EXECUTE 'DELETE FROM meetings';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        EXECUTE 'DELETE FROM tasks';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_documents') THEN
        EXECUTE 'DELETE FROM client_documents';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE 'DELETE FROM clients';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff_availability') THEN
        EXECUTE 'DELETE FROM staff_availability';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff') THEN
        EXECUTE 'DELETE FROM staff';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'DELETE FROM users';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'firms') THEN
        EXECUTE 'DELETE FROM firms';
    END IF;

    -- 2. CLEANUP AUTH USERS
    -- We remove the specific demo users from auth.users to ensure a clean slate.
    -- This prevents "Duplicate Key" on insert and ensures the password is reset.
    DELETE FROM auth.users WHERE email IN (admin_email, manager_email, staff1_email, staff2_email);

    -- 3. INSERT FIRM
    INSERT INTO firms (id, name, registration_number, address, phone, email, website)
    VALUES (demo_firm_id, 'Demo CA Associates', 'CA12345', '123 Business District, Mumbai', '+91 22 1234 5678', 'info@democaassociates.com', 'www.democaassociates.com');

    -- 4. INSERT AUTH USERS (Fresh Creation)
    -- Admin
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
    VALUES ('00000000-0000-0000-0000-000000000000', partner_id, 'authenticated', 'authenticated', admin_email, crypt('admin123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

    -- Manager
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
    VALUES ('00000000-0000-0000-0000-000000000000', manager_id, 'authenticated', 'authenticated', manager_email, crypt('manager123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

    -- Staff 1
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
    VALUES ('00000000-0000-0000-0000-000000000000', staff1_id, 'authenticated', 'authenticated', staff1_email, crypt('staff123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

    -- Staff 2
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', staff2_id, 'authenticated', 'authenticated', staff2_email, crypt('staff123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

    -- 5. INSERT PUBLIC USERS (Matching Auth IDs)
    INSERT INTO users (id, firm_id, email, username, password_hash, full_name, role, phone)
    VALUES
        (partner_id, demo_firm_id, admin_email, 'admin', crypt('admin123', gen_salt('bf')), 'Rajesh Sharma', 'partner', '+91 98765 43210'),
        (manager_id, demo_firm_id, manager_email, 'manager', crypt('manager123', gen_salt('bf')), 'Priya Patel', 'manager', '+91 98765 43211'),
        (staff1_id, demo_firm_id, staff1_email, 'staff', crypt('staff123', gen_salt('bf')), 'Amit Kumar', 'staff', '+91 98765 43212'),
        (staff2_id, demo_firm_id, staff2_email, 'staff2', crypt('staff123', gen_salt('bf')), 'Sneha Gupta', 'staff', '+91 98765 43213');

    -- 6. INSERT STAFF DETAILS
    INSERT INTO staff (user_id, firm_id, employee_id, department, hourly_rate, is_available)
    VALUES
        (staff1_id, demo_firm_id, 'EMP001', 'Tax', 500.00, true),
        (staff2_id, demo_firm_id, 'EMP002', 'Audit', 600.00, true);

    -- 7. INSERT CLIENTS
    INSERT INTO clients (id, firm_id, name, pan, email, work_types, created_by)
    VALUES
        (client1_id, demo_firm_id, 'ABC Enterprises', 'ABCDE1234F', 'contact@abc.com', ARRAY['GST', 'TDS'], partner_id);

    -- 8. PERMISSIONS (Safety)
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

    RAISE NOTICE 'Reseed Complete Successfully!';
END $$;
