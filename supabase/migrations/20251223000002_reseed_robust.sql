/*
  # ROBUST RESEED SCRIPT
  # Purpose: Safely re-populate the database handling existing Auth Users.
  # This script avoids "duplicate key" errors by checking for existing emails first.
  
  # INSTRUCTIONS: Run this ENTIRE SCRIPT in the Supabase SQL Editor.
*/

-- 1. CLEANUP PUBLIC TABLES (Keep Auth tables intact to avoid breaking other things)
TRUNCATE TABLE task_comments CASCADE;
TRUNCATE TABLE meetings CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE client_documents CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE staff_availability CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE firms CASCADE;

DO $$
DECLARE
    -- Fixed Firm ID
    demo_firm_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    -- Emails
    admin_email text := 'admin@democaassociates.com';
    manager_email text := 'manager@democaassociates.com';
    staff1_email text := 'staff@democaassociates.com';
    staff2_email text := 'staff2@democaassociates.com';

    -- Resolved IDs (will be fetched or generated)
    partner_id uuid;
    manager_id uuid;
    staff1_id uuid;
    staff2_id uuid;
    client1_id uuid := 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';
BEGIN
    -- =================================================================
    -- 2. RESOLVE AUTH USERS (Get existing ID or Create new)
    -- =================================================================

    -- ADMIN (Partner)
    SELECT id INTO partner_id FROM auth.users WHERE email = admin_email;
    IF partner_id IS NULL THEN
        partner_id := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'; -- Default if new
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
        VALUES ('00000000-0000-0000-0000-000000000000', partner_id, 'authenticated', 'authenticated', admin_email, crypt('admin123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');
    ELSE
        -- Update password to ensure it matches 'admin123'
        UPDATE auth.users SET encrypted_password = crypt('admin123', gen_salt('bf')) WHERE id = partner_id;
    END IF;

    -- MANAGER
    SELECT id INTO manager_id FROM auth.users WHERE email = manager_email;
    IF manager_id IS NULL THEN
        manager_id := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
        VALUES ('00000000-0000-0000-0000-000000000000', manager_id, 'authenticated', 'authenticated', manager_email, crypt('manager123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('manager123', gen_salt('bf')) WHERE id = manager_id;
    END IF;

    -- STAFF 1
    SELECT id INTO staff1_id FROM auth.users WHERE email = staff1_email;
    IF staff1_id IS NULL THEN
        staff1_id := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
        VALUES ('00000000-0000-0000-0000-000000000000', staff1_id, 'authenticated', 'authenticated', staff1_email, crypt('staff123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('staff123', gen_salt('bf')) WHERE id = staff1_id;
    END IF;

    -- STAFF 2
    SELECT id INTO staff2_id FROM auth.users WHERE email = staff2_email;
    IF staff2_id IS NULL THEN
        staff2_id := 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000000', staff2_id, 'authenticated', 'authenticated', staff2_email, crypt('staff123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('staff123', gen_salt('bf')) WHERE id = staff2_id;
    END IF;

    -- =================================================================
    -- 3. INSERT FIRM (Public)
    -- =================================================================
    INSERT INTO firms (id, name, registration_number, address, phone, email, website)
    VALUES (demo_firm_id, 'Demo CA Associates', 'CA12345', '123 Business District, Mumbai', '+91 22 1234 5678', 'info@democaassociates.com', 'www.democaassociates.com');

    -- =================================================================
    -- 4. INSERT PUBLIC USERS (Using Resolved IDs)
    -- =================================================================
    INSERT INTO users (id, firm_id, email, username, password_hash, full_name, role, phone)
    VALUES
        (partner_id, demo_firm_id, admin_email, 'admin', crypt('admin123', gen_salt('bf')), 'Rajesh Sharma', 'partner', '+91 98765 43210'),
        (manager_id, demo_firm_id, manager_email, 'manager', crypt('manager123', gen_salt('bf')), 'Priya Patel', 'manager', '+91 98765 43211'),
        (staff1_id, demo_firm_id, staff1_email, 'staff', crypt('staff123', gen_salt('bf')), 'Amit Kumar', 'staff', '+91 98765 43212'),
        (staff2_id, demo_firm_id, staff2_email, 'staff2', crypt('staff123', gen_salt('bf')), 'Sneha Gupta', 'staff', '+91 98765 43213');

    -- =================================================================
    -- 5. INSERT STAFF DETAILS
    -- =================================================================
    INSERT INTO staff (user_id, firm_id, employee_id, department, hourly_rate, is_available)
    VALUES
        (staff1_id, demo_firm_id, 'EMP001', 'Tax', 500.00, true),
        (staff2_id, demo_firm_id, 'EMP002', 'Audit', 600.00, true);

    -- =================================================================
    -- 6. INSERT CLIENTS
    -- =================================================================
    INSERT INTO clients (id, firm_id, name, pan, email, work_types, created_by)
    VALUES
        (client1_id, demo_firm_id, 'ABC Enterprises', 'ABCDE1234F', 'contact@abc.com', ARRAY['GST', 'TDS'], partner_id);

    -- =================================================================
    -- 7. GRANT PERMISSIONS (Safety measure)
    -- =================================================================
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

END $$;
