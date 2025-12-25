import { supabase } from './supabase';
import { Client } from '../types';
import { useAuthStore } from '../store/auth.store';

class ClientsService {
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        created_by_user:users!clients_created_by_fkey(full_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createClient(client: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Client> {
    // Get current user's firm_id
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...client, firm_id: firmId }])
      .select(`
        *,
        created_by_user:users!clients_created_by_fkey(full_name)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async importClients(clients: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Client[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const clientsWithFirm = clients.map(client => ({ ...client, firm_id: firmId }));

    const { data, error } = await supabase
      .from('clients')
      .insert(clientsWithFirm)
      .select();

    if (error) throw error;
    return data || [];
  }
}

export const clientsService = new ClientsService();