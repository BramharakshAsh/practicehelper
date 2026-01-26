import { create } from 'zustand';
import { Client } from '../types';
import { clientsService } from '../services/clients.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface ClientsState {
  clients: Client[];
  isLoading: boolean;
  hasFetched: boolean;
  error: string | null;

  // Actions
  fetchClients: () => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  importClients: (clients: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  clearError: () => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  isLoading: false,
  hasFetched: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const clients = await clientsService.getClients();
      set({ clients, isLoading: false, hasFetched: true });
    }, 'Fetch clients').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false,
        hasFetched: true
      });
    });
  },

  createClient: async (clientData) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const newClient = await clientsService.createClient(clientData);
      set(state => ({
        clients: [newClient, ...state.clients],
        isLoading: false
      }));
    }, 'Create client').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  updateClient: async (id, updates) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const updatedClient = await clientsService.updateClient(id, updates);
      set(state => ({
        clients: state.clients.map(client =>
          client.id === id ? updatedClient : client
        ),
        isLoading: false
      }));
    }, 'Update client').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  deleteClient: async (id) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      await clientsService.deleteClient(id);
      set(state => ({
        clients: state.clients.filter(client => client.id !== id),
        isLoading: false
      }));
    }, 'Delete client').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  importClients: async (clientsData) => {
    set({ isLoading: true, error: null });

    return await handleAsyncError(async () => {
      const result = await clientsService.importClients(clientsData);

      // Refetch clients to get latest state including new ones
      const clients = await clientsService.getClients();

      set({
        clients,
        isLoading: false
      });

      return result; // Pass result back to UI
    }, 'Import clients').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  clearError: () => set({ error: null }),
}));