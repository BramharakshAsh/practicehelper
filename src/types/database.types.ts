import { Task, Client, Staff, ComplianceType, User } from './index';

export interface DBTaskResponse extends Omit<Task, 'client' | 'staff' | 'creator' | 'compliance_type'> {
    client: Client | undefined;
    staff: { id: string; full_name: string; role: string; email: string } | null;
    creator: { id: string; full_name: string; role: string; email: string } | null;
    compliance_type: ComplianceType | undefined;
}

export interface DBClientResponse extends Client {
    manager?: { id: string; full_name: string; role: string; email: string } | null;
}

export interface DBStaffResponse extends Staff {
    user?: User | null;
}
