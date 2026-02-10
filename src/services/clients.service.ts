import { Client } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { DBClientResponse } from '../types/database.types';
import { devLog, devWarn, devError } from './logger';

class ClientsService {
  async getClients(): Promise<Client[]> {
    const user = useAuthStore.getState().user;
    const firmId = user?.firm_id;
    if (!firmId) return [];

    let query = supabase
      .from('clients')
      .select('*')
      .eq('firm_id', firmId)
      .eq('is_active', true);

    if (user.role === 'manager') {
      query = query.eq('manager_id', user.id);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return (data as unknown as DBClientResponse[]) || [];
  }

  async createClient(client: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const currentUser = useAuthStore.getState().user;
    // Ensure manager_id is null if it's an empty string
    const sanitizedManagerId = client.manager_id === '' ? null : client.manager_id;
    const finalManagerId = sanitizedManagerId || (currentUser?.role === 'manager' ? currentUser.id : null);

    const normalizedClient = {
      ...client,
      name: client.name.trim(),
      pan: client.pan.trim().toUpperCase(),
      gstin: client.gstin?.trim() || null,
      email: client.email?.trim() || null,
      phone: client.phone?.trim() || null,
      address: client.address?.trim() || null,
      firm_id: firmId,
      manager_id: finalManagerId,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(normalizedClient)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as DBClientResponse;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const sanitizedUpdates = {
      ...updates,
      manager_id: updates.manager_id === '' ? null : updates.manager_id
    };

    const { data, error } = await supabase
      .from('clients')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as DBClientResponse;
  }

  async deleteClient(id: string): Promise<void> {
    devLog('[ClientsService] Deleting tasks for client:', id);
    // Delete all tasks associated with this client
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('client_id', id);

    if (taskError) {
      devError('[ClientsService] Error deleting client tasks:', taskError);
      throw taskError;
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async importClients(clientsData: any[]): Promise<{ success: number; failures: number; errors: string[] }> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    // 1. Fetch staff to resolve manager names
    const { staffService } = await import('./staff.service');
    const allStaff = await staffService.getStaff();

    const results = {
      success: 0,
      failures: 0,
      errors: [] as string[]
    };

    let rowIndex = 2; // Data starts at row 2
    for (const item of clientsData) {
      const rowNum = rowIndex++;
      try {
        if (!item.name || !item.pan) {
          throw new Error(`Name and PAN are required fields.`);
        }

        // Resolve manager_id from manager_name / assigned_manager
        let managerId: string | null = null;
        const managerName = (item.assigned_manager || item.manager_name || '').trim();
        if (managerName && managerName.toLowerCase() !== 'unassigned') {
          const manager = allStaff.find(s => s.name.toLowerCase() === managerName.toLowerCase());
          if (manager) {
            managerId = manager.user_id;
          } else {
            devWarn(`[ClientsService] Row ${rowNum}: Manager "${managerName}" not found.`);
            results.errors.push(`Row ${rowNum}: Manager "${managerName}" not found. Setting as Unassigned.`);
          }
        }

        // Resolve work_types from individual columns
        const workTypes: string[] = [];
        const isYes = (val: any) => String(val || '').toLowerCase().startsWith('y');

        if (isYes(item.gst_work) || isYes(item.gst)) workTypes.push('GST');
        if (isYes(item.tds_work) || isYes(item.tds)) workTypes.push('TDS');
        if (isYes(item.it_work) || isYes(item.it) || isYes(item.income_tax)) workTypes.push('Income Tax');
        if (isYes(item.audit_work) || isYes(item.audit)) workTypes.push('Audit');
        if (isYes(item.roc_work) || isYes(item.roc)) workTypes.push('ROC');
        if (isYes(item.payroll_work) || isYes(item.payroll)) workTypes.push('Payroll');
        if (isYes(item.accounting_work) || isYes(item.accounting)) workTypes.push('Accounting');

        const normalizedClient = {
          name: String(item.name).trim(),
          pan: String(item.pan).trim().toUpperCase(),
          gstin: item.gstin ? String(item.gstin).trim() : null,
          email: item.email ? String(item.email).trim() : null,
          phone: item.phone ? String(item.phone).trim() : null,
          legal_form: item.legal_form ? String(item.legal_form).trim() : null,
          client_group: item.client_group ? String(item.client_group).trim() : (item.group ? String(item.group).trim() : null),
          manager_id: managerId,
          address: item.address ? String(item.address).trim() : null,
          instructions: item.special_instructions ? String(item.special_instructions).trim() : (item.instructions ? String(item.instructions).trim() : null),
          to_remember: item.points_to_remember ? String(item.points_to_remember).trim() : (item.to_remember ? String(item.to_remember).trim() : null),
          work_types: workTypes.length > 0 ? workTypes : (item.work_types || []),
          firm_id: firmId,
          is_active: true
        };

        const { error } = await supabase
          .from('clients')
          .insert(normalizedClient);

        if (error) {
          if (error.code === '23505') throw new Error(`Client with this PAN already exists.`);
          throw error;
        }

        results.success++;
      } catch (err: any) {
        devError(`[ClientsService] Row ${rowNum} failure:`, err);
        results.failures++;
        const errorMessage = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
        results.errors.push(`Row ${rowNum}: ${errorMessage}`);
      }
    }

    return results;
  }

  async getClientStaffRelations(): Promise<import('../types').ClientStaffRelation[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) return [];

    const { data, error } = await supabase
      .from('client_staff_relations')
      .select('*')
      .eq('firm_id', firmId);

    if (error) throw error;
    return data || [];
  }

  async saveClientStaffRelation(clientId: string, staffId: string): Promise<void> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated');

    devLog('[ClientsService] Saving client-staff relation:', { clientId, staffId, firmId });

    // First delete any existing relation for this client (to enforce 1-to-1 default assignee behavior)
    // Actually, maybe we want multiple relations? "relations" could mean a team.
    // But for auto-assignment, usually it's one person or round-robin using the set.
    // Let's allow replacing the existing one for now to keep it simple and deterministic.

    // Actually, looking at the schema: `client_staff_relations` is `UNIQUE(client_id, staff_id)`.
    // If I want to update the "default", I should probably delete others for this client first.

    const { error: delError } = await supabase
      .from('client_staff_relations')
      .delete()
      .eq('client_id', clientId)
      .eq('firm_id', firmId);

    if (delError) {
      devError('[ClientsService] Delete error:', delError);
      throw delError;
    }
    devLog('[ClientsService] Deleted existing relations for client');

    if (staffId) { // If staffId is provided (not just clearing)
      const { error, data } = await supabase
        .from('client_staff_relations')
        .insert({
          firm_id: firmId,
          client_id: clientId,
          staff_id: staffId
        })
        .select();

      if (error) {
        devError('[ClientsService] Insert error:', error);
        throw error;
      }
      devLog('[ClientsService] Inserted new relation:', data);
    } else {
      devLog('[ClientsService] No staff ID provided - relation cleared (random assignment)');
    }
  }
}

export const clientsService = new ClientsService();
