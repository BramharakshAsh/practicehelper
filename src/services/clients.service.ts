import { Client } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

class ClientsService {
  async getClients(): Promise<Client[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createClient(client: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        firm_id: firmId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  async importClients(clientsData: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Client[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const { data, error } = await supabase
      .from('clients')
      .insert(clientsData.map(c => ({ ...c, firm_id: firmId })))
      .select();

    if (error) throw error;
    return data || [];
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

    // Upsert logic (delete existing for client then insert, or just upsert unique on client_id? 
    // Schema has UNIQUE(client_id, staff_id), but functionally we likely want 1 staff per client task assignment default?
    // User request: "define client to staff relations". One-to-one is implied for "default assignee".
    // I'll assume 1-to-1 default assignee for simplicity. The schema table allows unique mappings.
    // If I want 1-to-1, I should first delete any existing relation for this client?
    // Or maybe the UI handles it. The schema UNIQUE is on (client_id, staff_id), so a client could have multiple staff mapped if not constrained.
    // But "base for assigning auto tasks" implies a single default (or random selection from multiple?).
    // "In case no relation is defined... allocated randomly".
    // Let's implement upsert or delete-insert.
    // Since UI will likely show one selector, let's treat it as single.

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

    if (delError) throw delError;

    if (staffId) { // If staffId is provided (not just clearing)
      const { error } = await supabase
        .from('client_staff_relations')
        .insert({
          firm_id: firmId,
          client_id: clientId,
          staff_id: staffId
        });
      if (error) throw error;
    }
  }
}

export const clientsService = new ClientsService();
