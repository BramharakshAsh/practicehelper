/*
  # MINIMAL RESEED SCRIPT
  # Purpose: Insert Auth users with minimal columns to let defaults handle the rest.
*/

DO $$
DECLARE
    -- IDs (Must match public.users)
    partner_id uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    demo_firm_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    admin_email text := 'admin@democaassociates.com';
BEGIN
    -- 1. Cleanup
    DELETE FROM auth.users WHERE email = admin_email;
    DELETE FROM public.users WHERE email = admin_email;
    DELETE FROM public.firms WHERE id = demo_firm_id;

    -- 2. Insert Firm
    INSERT INTO firms (id, name, registration_number, address, phone, email, website)
    VALUES (demo_firm_id, 'Demo CA Associates', 'CA12345', '123 Business District, Mumbai', '+91 22 1234 5678', 'info@democaassociates.com', 'www.democaassociates.com');

    -- 3. Insert Auth User (MINIMAL COLUMNS)
    -- We only provide what is absolutely necessary.
    -- 'aud' usually defaults to 'authenticated'
    -- 'role' usually defaults to 'authenticated'
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (
        partner_id, 
        admin_email, 
        crypt('admin123', gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{}', 
        now(), 
        now(),
        'authenticated',
        'authenticated'
    );

    -- 4. Insert Public User
    INSERT INTO users (id, firm_id, email, username, password_hash, full_name, role, phone)
    VALUES (partner_id, demo_firm_id, admin_email, 'admin', crypt('admin123', gen_salt('bf')), 'Rajesh Sharma', 'partner', '+91 98765 43210');
    
    -- Grant permissions again just in case
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

END $$;
