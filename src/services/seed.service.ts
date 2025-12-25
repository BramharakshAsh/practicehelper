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
                work_types: ['GST', 'Income Tax'],
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
                work_types: ['Audit', 'GST'],
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
            {
                id: 'ct1',
                name: 'GST Monthly Filing',
                code: 'GSTR-3B',
                frequency: 'monthly',
                due_day: 20,
                is_active: true,
                created_at: new Date().toISOString(),
            },
            {
                id: 'ct2',
                name: 'Income Tax Return',
                code: 'ITR',
                frequency: 'yearly',
                due_day: 31,
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
