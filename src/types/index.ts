export interface Firm {
  id: string;
  name: string;
  pan: string;
  gstin: string;
  email: string;
  contact_number: string;
  website: string;
  address: string;
  is_active: boolean;
  invoice_prefix: string;
  invoice_sequence: number;
  invoice_theme: 'classic' | 'modern' | 'minimal';
  subscription_tier: 'free' | 'growth';
  subscription_status: 'active' | 'inactive' | 'past_due';
  custom_user_limit?: number;
  custom_client_limit?: number;
  excel_imports_count: number;
  last_auto_task_run_at?: string;
  subscription_updated_at?: string;
  subscription_end_date?: string;
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
  legal_form?: string;
  work_types: string[];
  is_active: boolean;
  created_by?: string;
  manager_id?: string;
  client_group?: string;
  instructions?: string;
  to_remember?: string;
  auto_mail_enabled: boolean;
  mail_frequency: 'monthly' | 'quarterly' | 'none';
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
  category: 'GST' | 'Income Tax' | 'TDS' | 'ROC' | 'Audit' | 'Payroll' | 'Others' | string;
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
  scheduled_for?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  period: string; // e.g., "March 2024", "Q1 2024"
  remarks?: string;
  delay_reason?: string;
  estimated_hours?: number;
  actual_hours?: number;
  checklist?: ChecklistItem[];
  checklist_progress?: { [itemId: string]: boolean };
  audit_id?: string;
  filing_reference?: string;
  filing_date?: string;
  filing_proof_url?: string;
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
export type TaskStatus = 'assigned' | 'in_progress' | 'awaiting_client_data' | 'ready_for_review' | 'filed_completed' | 'scheduled';

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

export interface Document {
  id: string;
  firm_id: string;
  client_id: string;
  task_id?: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  storage_path: string;
  category: string;
  financial_year?: string;
  period?: string;
  version: number;
  uploaded_by?: string;
  uploaded_at: string;
  notes?: string;
  tags?: string[];
  client?: { name: string };
}

export interface TimeEntry {
  id: string;
  firm_id: string;
  task_id: string;
  staff_id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  is_billable: boolean;
  billing_rate?: number;
  notes?: string;
  entry_type: 'timer' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  firm_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  notes?: string;
  terms?: string;
  is_gst: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  type: 'service' | 'reimbursement';
  time_entry_id?: string;
  created_at: string;
}

export interface InvoiceTemplate {
  id: string;
  firm_id: string;
  name: string;
  description?: string;
  items: { description: string; unit_price: number; type: 'service' | 'reimbursement' }[];
  terms?: string;
  notes?: string;
  is_gst: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  firm_id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  invoice?: Invoice;
}
