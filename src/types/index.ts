export interface Firm {
  id: string;
  name: string;
  registration_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  firm_id: string;
  email: string;
  username?: string;
  pan?: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  firm_id: string;
  name: string;
  gstin?: string;
  pan: string;
  email?: string;
  phone?: string;
  address?: string;
  work_types: string[];
  is_active: boolean;
  created_by?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  user_id: string;
  firm_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  employee_id?: string;
  department?: string;
  specializations: string[];
  hourly_rate?: number;
  is_available: boolean;
  is_active: boolean;
  date_of_joining?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskTemplate {
  id: string;
  firm_id: string;
  name: string;
  description?: string;
  compliance_type_id?: string;
  default_priority: Task['priority'];
  estimated_hours?: number;
  checklist_items: ChecklistItem[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceType {
  id: string;
  firm_id?: string;
  category: 'GST' | 'Income Tax' | 'TDS' | 'Others';
  name: string;
  code: string;
  description?: string;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'as_needed';
  due_day: number;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  firm_id: string;
  client_id: string;
  staff_id: string;
  compliance_type_id: string;
  template_id?: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'assigned' | 'in_progress' | 'awaiting_client_data' | 'ready_for_review' | 'filed_completed';
  priority: 'low' | 'medium' | 'high';
  period: string; // e.g., "March 2024", "Q1 2024"
  remarks?: string;
  delay_reason?: string;
  estimated_hours?: number;
  actual_hours?: number;
  checklist_progress?: { [itemId: string]: boolean };
  audit_id?: string;
  created_at: string;
  updated_at: string;
  assigned_by: string;
  client?: Client;
  staff?: Staff;
  creator?: User;
  compliance_type?: ComplianceType;
}

export interface StaffAvailability {
  id: string;
  firm_id: string;
  staff_id: string;
  date: string;
  is_available: boolean;
  availability_type?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  firm_id: string;
  table_name: string;
  record_id: string;
  action: 'create' | 'update' | 'delete' | 'assign' | 'status_change';
  old_values?: any;
  new_values?: any;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface TaskStatusUpdate {
  id: string;
  task_id: string;
  status: Task['status'];
  remarks?: string;
  updated_by: string;
  created_at: string;
}

export type UserRole = 'partner' | 'manager' | 'staff' | 'paid_staff' | 'articles';

export interface DashboardStats {
  total_clients: number;
  total_staff: number;
  overdue_tasks: number;
  pending_review: number;
  completed_today: number;
  upcoming_due_dates: number;
}

export interface Meeting {
  id: string;
  firm_id: string;
  client_id: string;
  staff_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_link?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  staff?: Staff;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ClientStaffRelation {
  id: string;
  firm_id: string;
  client_id: string;
  staff_id: string;
  created_at: string;
}

export interface AuditPlan {
  id: string;
  firm_id: string;
  client_id: string;
  lead_staff_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  lead_staff?: Staff;
}

export interface AuditChecklistItem {
  id: string;
  audit_id: string;
  parent_id?: string;
  title: string;
  description?: string;
  assigned_to?: string;
  target_date?: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  children?: AuditChecklistItem[];
  assigned_staff?: Staff;
}

export interface AuditPlanTemplate {
  id: string;
  firm_id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditTemplateItem {
  id: string;
  template_id: string;
  parent_id?: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}
