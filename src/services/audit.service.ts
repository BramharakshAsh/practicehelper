import { supabase } from './supabase';
import { AuditLog } from '../types';

class AuditService {
  async getAuditLogs(filters?: {
    table_name?: string;
    record_id?: string;
    user_id?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users!audit_logs_user_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.table_name) {
      query = query.eq('table_name', filters.table_name);
    }

    if (filters?.record_id) {
      query = query.eq('record_id', filters.record_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getTaskAuditTrail(taskId: string): Promise<AuditLog[]> {
    return this.getAuditLogs({
      table_name: 'tasks',
      record_id: taskId,
    });
  }

  async getClientAuditTrail(clientId: string): Promise<AuditLog[]> {
    return this.getAuditLogs({
      table_name: 'clients',
      record_id: clientId,
    });
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({
      user_id: userId,
      limit,
    });
  }

  // Manual audit log creation for custom events
  async createAuditLog(auditData: Omit<AuditLog, 'id' | 'firm_id' | 'created_at'>): Promise<AuditLog> {
    const firmId = 'demo-firm-id'; // This should be dynamic based on authenticated user
    
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{ ...auditData, firm_id: firmId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const auditService = new AuditService();