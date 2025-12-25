/*
  # ULTRA MINIMAL RESEED SCRIPT
  # Purpose: Insert Auth users with BARE MINIMUM columns.
*/

DO $$
DECLARE
    partner_id uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    demo_firm_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    admin_email text := 'admin@democaassociates.com';
BEGIN
    -- 1. Cleanup
    -- 1. Full Cleanup
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_comments') THEN EXECUTE 'DELETE FROM task_comments'; END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meetings') THEN EXECUTE 'DELETE FROM meetings'; END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN EXECUTE 'DELETE FROM tasks'; END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_documents') THEN EXECUTE 'DELETE FROM client_documents'; END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN EXECUTE 'DELETE FROM clients'; END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff_availability') THEN EXECUTE 'DELETE FROM staff_availability'; END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff') THEN EXECUTE 'DELETE FROM staff'; END IF;
    
    DELETE FROM auth.users WHERE email = admin_email;
    DELETE FROM public.users WHERE email = admin_email;
    DELETE FROM public.firms WHERE id = demo_firm_id;

    -- 2. Insert Firm
    INSERT INTO firms (id, name, registration_number, address, phone, email, website)
    VALUES (demo_firm_id, 'Demo CA Associates', 'CA12345', '123 Business District, Mumbai', '+91 22 1234 5678', 'info@democaassociates.com', 'www.democaassociates.com');

    -- 3. Insert Auth User (NO INSTANCE_ID)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
        partner_id, 
        admin_email, 
        crypt('admin123', gen_salt('bf')), 
        now()
    );

    -- 4. Insert Public User
    INSERT INTO users (id, firm_id, email, username, password_hash, full_name, role, phone)
    VALUES (partner_id, demo_firm_id, admin_email, 'admin', crypt('admin123', gen_salt('bf')), 'Rajesh Sharma', 'partner', '+91 98765 43210');
    
    RAISE NOTICE 'Ultra Minimal Reseed Complete';
END $$;
