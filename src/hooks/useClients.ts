import { useEffect } from 'react';
import { useClientsStore } from '../store/clients.store';
import { Client } from '../types';

export const useClients = () => {
  const {
    clients,
    isLoading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    importClients,
    clearError,
  } = useClientsStore();

  useEffect(() => {
    if (clients.length === 0 && !isLoading) {
      fetchClients();
    }
  }, [clients.length, isLoading, fetchClients]);

  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => {
    try {
      await createClient(clientData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    try {
      await updateClient(id, updates);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleImportClients = async (clientsData: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      await importClients(clientsData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  return {
    clients,
    isLoading,
    error,
    createClient: handleCreateClient,
    updateClient: handleUpdateClient,
    deleteClient: handleDeleteClient,
    importClients: handleImportClients,
    refetch: fetchClients,
    clearError,
  };
};