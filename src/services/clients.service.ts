import { Client } from '../types';
import { useAuthStore } from '../store/auth.store';
import { LocalStorageService } from './local-storage.service';

const CLIENTS_KEY = 'ca_practice_manager_clients';

class ClientsService {
  async getClients(): Promise<Client[]> {
    return LocalStorageService.getItem<Client[]>(CLIENTS_KEY, []);
  }

  async createClient(client: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const clients = await this.getClients();
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      firm_id: firmId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    clients.push(newClient);
    LocalStorageService.setItem(CLIENTS_KEY, clients);
    return newClient;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const clients = await this.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client not found');

    const updatedClient = {
      ...clients[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    clients[index] = updatedClient;
    LocalStorageService.setItem(CLIENTS_KEY, clients);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    const clients = await this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    LocalStorageService.setItem(CLIENTS_KEY, filtered);
  }

  async importClients(clientsData: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Client[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const currentClients = await this.getClients();
    const newClients = clientsData.map(c => ({
      ...c,
      id: crypto.randomUUID(),
      firm_id: firmId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    }));

    const updatedClients = [...currentClients, ...newClients];
    LocalStorageService.setItem(CLIENTS_KEY, updatedClients);
    return newClients;
  }
}

export const clientsService = new ClientsService();
