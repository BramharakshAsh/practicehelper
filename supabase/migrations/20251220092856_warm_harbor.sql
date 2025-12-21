/*
  # Seed Demo Data for CA Practice Management System

  This migration creates demo data for testing the application:
  - Demo firm
  - Demo users (partner, manager, staff)
  - Demo clients
  - Demo compliance types
  - Demo tasks
*/

-- Insert demo firm
INSERT INTO firms (id, name, registration_number, address, phone, email, website) VALUES
  ('demo-firm-id', 'Demo CA Associates', 'CA12345', '123 Business District, Mumbai, Maharashtra 400001', '+91 22 1234 5678', 'info@democaassociates.com', 'www.democaassociates.com')
ON CONFLICT (id) DO NOTHING;

-- Insert demo users
INSERT INTO users (id, firm_id, email, username, password_hash, full_name, role, phone) VALUES
  ('partner_1', 'demo-firm-id', 'admin@democaassociates.com', 'admin', 'hashed_admin123', 'Rajesh Sharma', 'partner', '+91 98765 43210'),
  ('manager_1', 'demo-firm-id', 'manager@democaassociates.com', 'manager', 'hashed_manager123', 'Priya Patel', 'manager', '+91 98765 43211'),
  ('staff_1', 'demo-firm-id', 'staff@democaassociates.com', 'staff', 'hashed_staff123', 'Amit Kumar', 'staff', '+91 98765 43212'),
  ('staff_2', 'demo-firm-id', 'staff2@democaassociates.com', 'staff2', 'hashed_staff123', 'Sneha Gupta', 'staff', '+91 98765 43213')
ON CONFLICT (id) DO NOTHING;

-- Insert staff details
INSERT INTO staff (user_id, firm_id, employee_id, department, specializations, hourly_rate, is_available) VALUES
  ('staff_1', 'demo-firm-id', 'EMP001', 'Tax', ARRAY['GST', 'Income Tax'], 500.00, true),
  ('staff_2', 'demo-firm-id', 'EMP002', 'Audit', ARRAY['Statutory Audit', 'Internal Audit'], 600.00, true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert demo clients
INSERT INTO clients (id, firm_id, name, gstin, pan, email, phone, address, work_types, created_by) VALUES
  ('client_1', 'demo-firm-id', 'ABC Enterprises Pvt Ltd', '29ABCDE1234F1Z5', 'ABCDE1234F', 'contact@abc.com', '+91 98765 11111', '456 Industrial Area, Mumbai', ARRAY['GST', 'TDS', 'IT'], 'partner_1'),
  ('client_2', 'demo-firm-id', 'XYZ Trading Co', '27XYZAB5678G2H9', 'XYZAB5678G', 'info@xyz.com', '+91 98765 22222', '789 Commercial Street, Delhi', ARRAY['GST', 'ACCOUNTING'], 'partner_1'),
  ('client_3', 'demo-firm-id', 'PQR Manufacturing Ltd', '19PQRCD9012H3I4', 'PQRCD9012H', 'admin@pqr.com', '+91 98765 33333', '321 Factory Road, Pune', ARRAY['GST', 'TDS', 'AUDIT'], 'partner_1')
ON CONFLICT (id) DO NOTHING;

-- Update compliance types with firm association
UPDATE compliance_types SET firm_id = 'demo-firm-id' WHERE firm_id IS NULL;

-- Insert demo tasks
INSERT INTO tasks (id, firm_id, client_id, staff_id, compliance_type_id, title, description, due_date, status, priority, period, assigned_by) VALUES
  ('task_1', 'demo-firm-id', 'client_1', 'staff_1', (SELECT id FROM compliance_types WHERE code = 'GST' LIMIT 1), 'GST Return - March 2024', 'Monthly GST return filing for ABC Enterprises', '2024-04-20T23:59:59Z', 'in_progress', 'high', 'March 2024', 'partner_1'),
  ('task_2', 'demo-firm-id', 'client_2', 'staff_2', (SELECT id FROM compliance_types WHERE code = 'ACCOUNTING' LIMIT 1), 'Monthly Accounting - March 2024', 'Monthly books of accounts preparation', '2024-04-10T23:59:59Z', 'assigned', 'medium', 'March 2024', 'partner_1'),
  ('task_3', 'demo-firm-id', 'client_3', 'staff_1', (SELECT id FROM compliance_types WHERE code = 'TDS' LIMIT 1), 'TDS Return - March 2024', 'Monthly TDS return filing', '2024-04-07T23:59:59Z', 'ready_for_review', 'high', 'March 2024', 'partner_1'),
  ('task_4', 'demo-firm-id', 'client_1', 'staff_2', (SELECT id FROM compliance_types WHERE code = 'ACCOUNTING' LIMIT 1), 'Accounting - February 2024', 'Monthly accounting completed', '2024-03-10T23:59:59Z', 'filed_completed', 'medium', 'February 2024', 'partner_1')
ON CONFLICT (id) DO NOTHING;

-- Insert demo staff availability
INSERT INTO staff_availability (firm_id, staff_id, date, is_available, availability_type, notes) VALUES
  ('demo-firm-id', 'staff_1', CURRENT_DATE, true, 'full_day', 'Available for work'),
  ('demo-firm-id', 'staff_2', CURRENT_DATE, true, 'full_day', 'Available for work'),
  ('demo-firm-id', 'staff_1', CURRENT_DATE + INTERVAL '1 day', false, 'unavailable', 'Personal leave'),
  ('demo-firm-id', 'staff_2', CURRENT_DATE + INTERVAL '2 days', true, 'half_day', 'Available until 2 PM')
ON CONFLICT (staff_id, date) DO NOTHING;