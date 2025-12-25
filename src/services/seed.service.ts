import { LocalStorageService } from './local-storage.service';

const CLIENTS_KEY = 'ca_practice_manager_clients';
const STAFF_KEY = 'ca_practice_manager_staff';
const COMPLIANCE_TYPES_KEY = 'ca_practice_manager_compliance_types';
const TASKS_KEY = 'ca_practice_manager_tasks';

export const seedInitialData = () => {
    const firmId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    // Seed Clients
    if (LocalStorageService.getItem(CLIENTS_KEY, []).length === 0) {
        LocalStorageService.setItem(CLIENTS_KEY, [
            {
                id: 'c1',
                firm_id: firmId,
                name: 'TechFlow Solutions',
                gstin: '27AAAAA0000A1Z5',
                pan: 'AAAAA0000A',
                email: 'accounts@techflow.com',
                work_types: ['GSTR-1', 'GSTR-3B', 'ITR', 'ACCOUNTING', 'PAYROLL'],
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'c2',
                firm_id: firmId,
                name: 'Global Exports Ltd',
                gstin: '27BBBBB0000B1Z5',
                pan: 'BBBBB0000B',
                email: 'finance@globalexports.com',
                work_types: ['AUDIT', 'GSTR-1', 'GSTR-3B', 'GSTR-9', '24Q', '26Q'],
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        ]);
    }

    // Seed Staff
    if (LocalStorageService.getItem(STAFF_KEY, []).length === 0) {
        LocalStorageService.setItem(STAFF_KEY, [
            {
                id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', // Admin/Partner
                user_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
                firm_id: firmId,
                name: 'Rajesh Sharma',
                email: 'admin@democaassociates.com',
                role: 'partner',
                specializations: ['Audit', 'Taxation'],
                is_available: true,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
                user_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
                firm_id: firmId,
                name: 'Suresh Kumar',
                email: 'manager@democaassociates.com',
                role: 'manager',
                specializations: ['GST', 'Compliance'],
                is_available: true,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
                user_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
                firm_id: firmId,
                name: 'Anita Desai',
                email: 'staff@democaassociates.com',
                role: 'staff',
                specializations: ['Data Entry', 'GST Filing'],
                is_available: true,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        ]);
    }

    // Seed Compliance Types
    if (LocalStorageService.getItem(COMPLIANCE_TYPES_KEY, []).length === 0) {
        LocalStorageService.setItem(COMPLIANCE_TYPES_KEY, [
            // GST Category
            {
                id: 'ct1',
                category: 'GST',
                name: 'GSTR-1',
                code: 'GSTR-1',
                description: 'GST Return for outward supplies',
                frequency: 'monthly',
                due_day: 11,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct2',
                category: 'GST',
                name: 'GSTR-3B',
                code: 'GSTR-3B',
                description: 'Summary return for GST payment',
                frequency: 'monthly',
                due_day: 20,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct3',
                category: 'GST',
                name: 'GSTR-9',
                code: 'GSTR-9',
                description: 'Annual return',
                frequency: 'yearly',
                due_day: 31,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            // Income Tax Category
            {
                id: 'ct4',
                category: 'Income Tax',
                name: 'ITR',
                code: 'ITR',
                description: 'Income Tax Return',
                frequency: 'yearly',
                due_day: 31,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct5',
                category: 'Income Tax',
                name: 'Tax Audit',
                code: 'TAX-AUDIT',
                description: 'Tax audit under Section 44AB',
                frequency: 'yearly',
                due_day: 30,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct6',
                category: 'Income Tax',
                name: 'Transfer Pricing Audit',
                code: 'TP-AUDIT',
                description: 'Transfer pricing audit report',
                frequency: 'yearly',
                due_day: 31,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            // TDS Category
            {
                id: 'ct7',
                category: 'TDS',
                name: '24Q',
                code: '24Q',
                description: 'TDS on salaries',
                frequency: 'quarterly',
                due_day: 31,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct8',
                category: 'TDS',
                name: '26Q',
                code: '26Q',
                description: 'TDS on non-salary payments',
                frequency: 'quarterly',
                due_day: 31,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct9',
                category: 'TDS',
                name: '27Q',
                code: '27Q',
                description: 'TDS on payment to non-residents',
                frequency: 'quarterly',
                due_day: 31,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            // Others Category
            {
                id: 'ct10',
                category: 'Others',
                name: 'Accounting',
                code: 'ACCOUNTING',
                description: 'Monthly accounting and bookkeeping',
                frequency: 'monthly',
                due_day: 10,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct11',
                category: 'Others',
                name: 'Payroll',
                code: 'PAYROLL',
                description: 'Monthly payroll processing',
                frequency: 'monthly',
                due_day: 15,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct12',
                category: 'Others',
                name: 'Notices',
                code: 'NOTICES',
                description: 'Tax notices and responses',
                frequency: 'as_needed',
                due_day: 15,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct13',
                category: 'Others',
                name: 'Audit',
                code: 'AUDIT',
                description: 'Statutory audit',
                frequency: 'yearly',
                due_day: 30,
                is_active: true,
                created_at: new Date().toISOString(),
            }
        ]);
    }

    // Seed Tasks
    if (LocalStorageService.getItem(TASKS_KEY, []).length === 0) {
        LocalStorageService.setItem(TASKS_KEY, [
            {
                id: 't1',
                firm_id: firmId,
                client_id: 'c1',
                staff_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
                compliance_type_id: 'ct1',
                title: 'GSTR-3B filing for March 2024',
                due_date: '2024-04-20',
                status: 'assigned',
                priority: 'high',
                period: 'March 2024',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                assigned_by: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
            }
        ]);
    }
};
