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

    console.log('💾 Saving client-staff relation:', { clientId, staffId, firmId });

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
      console.error('❌ Delete error:', delError);
      throw delError;
    }
    console.log('✅ Deleted existing relations for client');

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
        console.error('❌ Insert error:', error);
        throw error;
      }
      console.log('✅ Inserted new relation:', data);
    } else {
      console.log('ℹ️ No staff ID provided - relation cleared (random assignment)');
    }
  }
}

export const clientsService = new ClientsService();
