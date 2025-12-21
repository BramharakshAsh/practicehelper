DO
$$
DECLARE
    demo_firm_id uuid := gen_random_uuid();
    partner_1_id uuid := gen_random_uuid();
    manager_1_id uuid := gen_random_uuid();
    staff_1_id uuid := gen_random_uuid();
    staff_2_id uuid := gen_random_uuid();
    client_1_id uuid := gen_random_uuid();
    client_2_id uuid := gen_random_uuid();
    client_3_id uuid := gen_random_uuid();
    gst_compliance_id uuid;
    tds_compliance_id uuid;
    accounting_compliance_id uuid;
BEGIN
    -- Insert demo firm
    INSERT INTO firms (id, name, registration_number, address, phone, email, website)
    VALUES (demo_firm_id, 'Demo CA Associates', 'CA12345', '123 Business District, Mumbai, Maharashtra 400001', '+91 22 1234 5678', 'info@democaassociates.com', 'www.democaassociates.com');

    -- Insert demo users
    INSERT INTO users (id, firm_id, email, username, password_hash, full_name, role, phone)
    VALUES
        (partner_1_id, demo_firm_id, 'admin@democaassociates.com', 'admin', crypt('admin123', gen_salt('bf')), 'Rajesh Sharma', 'partner', '+91 98765 43210'),
        (manager_1_id, demo_firm_id, 'manager@democaassociates.com', 'manager', crypt('manager123', gen_salt('bf')), 'Priya Patel', 'manager', '+91 98765 43211'),
        (staff_1_id, demo_firm_id, 'staff@democaassociates.com', 'staff', crypt('staff123', gen_salt('bf')), 'Amit Kumar', 'staff', '+91 98765 43212'),
        (staff_2_id, demo_firm_id, 'staff2@democaassociates.com', 'staff2', crypt('staff123', gen_salt('bf')), 'Sneha Gupta', 'staff', '+91 98765 43213');

    -- Insert staff details
    INSERT INTO staff (user_id, firm_id, employee_id, department, specializations, hourly_rate, is_available)
    VALUES
        (staff_1_id, demo_firm_id, 'EMP001', 'Tax', ARRAY['GST', 'Income Tax'], 500.00, true),
        (staff_2_id, demo_firm_id, 'EMP002', 'Audit', ARRAY['Statutory Audit', 'Internal Audit'], 600.00, true);

    -- Insert demo clients
    INSERT INTO clients (id, firm_id, name, gstin, pan, email, phone, address, work_types, created_by)
    VALUES
        (client_1_id, demo_firm_id, 'ABC Enterprises Pvt Ltd', '29ABCDE1234F1Z5', 'ABCDE1234F', 'contact@abc.com', '+91 98765 11111', '456 Industrial Area, Mumbai', ARRAY['GST', 'TDS', 'IT'], partner_1_id),
        (client_2_id, demo_firm_id, 'XYZ Trading Co', '27XYZAB5678G2H9', 'XYZAB5678G', 'info@xyz.com', '+91 98765 22222', '789 Commercial Street, Delhi', ARRAY['GST', 'ACCOUNTING'], partner_1_id),
        (client_3_id, demo_firm_id, 'PQR Manufacturing Ltd', '19PQRCD9012H3I4', 'PQRCD9012H', 'admin@pqr.com', '+91 98765 33333', '321 Factory Road, Pune', ARRAY['GST', 'TDS', 'AUDIT'], partner_1_id);

    -- Update compliance types with firm association
    UPDATE compliance_types SET firm_id = demo_firm_id WHERE firm_id IS NULL;

    -- Get compliance type IDs
    SELECT id INTO gst_compliance_id FROM compliance_types WHERE code = 'GST' AND firm_id = demo_firm_id LIMIT 1;
    SELECT id INTO tds_compliance_id FROM compliance_types WHERE code = 'TDS' AND firm_id = demo_firm_id LIMIT 1;
    SELECT id INTO accounting_compliance_id FROM compliance_types WHERE code = 'ACCOUNTING' AND firm_id = demo_firm_id LIMIT 1;

    -- Insert demo tasks if compliance types exist
    IF gst_compliance_id IS NOT NULL THEN
        INSERT INTO tasks (firm_id, client_id, staff_id, compliance_type_id, title, description, due_date, status, priority, period, assigned_by)
        VALUES (demo_firm_id, client_1_id, staff_1_id, gst_compliance_id, 'GST Return - March 2024', 'Monthly GST return filing for ABC Enterprises', '2024-04-20T23:59:59Z', 'in_progress', 'high', 'March 2024', partner_1_id);
    END IF;
    IF accounting_compliance_id IS NOT NULL THEN
        INSERT INTO tasks (firm_id, client_id, staff_id, compliance_type_id, title, description, due_date, status, priority, period, assigned_by)
        VALUES (demo_firm_id, client_2_id, staff_2_id, accounting_compliance_id, 'Monthly Accounting - March 2024', 'Monthly books of accounts preparation', '2024-04-10T23:59:59Z', 'assigned', 'medium', 'March 2024', partner_1_id);
    END IF;
    IF tds_compliance_id IS NOT NULL THEN
        INSERT INTO tasks (firm_id, client_id, staff_id, compliance_type_id, title, description, due_date, status, priority, period, assigned_by)
        VALUES (demo_firm_id, client_3_id, staff_1_id, tds_compliance_id, 'TDS Return - March 2024', 'Monthly TDS return filing', '2024-04-07T23:59:59Z', 'ready_for_review', 'high', 'March 2024', partner_1_id);
    END IF;
    IF accounting_compliance_id IS NOT NULL THEN
        INSERT INTO tasks (firm_id, client_id, staff_id, compliance_type_id, title, description, due_date, status, priority, period, assigned_by)
        VALUES (demo_firm_id, client_1_id, staff_2_id, accounting_compliance_id, 'Accounting - February 2024', 'Monthly accounting completed', '2024-03-10T23:59:59Z', 'filed_completed', 'medium', 'February 2024', partner_1_id);
    END IF;

    -- Insert demo staff availability
    INSERT INTO staff_availability (firm_id, staff_id, date, is_available, availability_type, notes)
    VALUES
        (demo_firm_id, staff_1_id, CURRENT_DATE, true, 'full_day', 'Available for work'),
        (demo_firm_id, staff_2_id, CURRENT_DATE, true, 'full_day', 'Available for work'),
        (demo_firm_id, staff_1_id, CURRENT_DATE + INTERVAL '1 day', false, 'unavailable', 'Personal leave'),
        (demo_firm_id, staff_2_id, CURRENT_DATE + INTERVAL '2 days', true, 'half_day', 'Available until 2 PM');
END;
$$;