import { useEffect } from 'react';
import { useClientsStore } from '../store/clients.store';
import { Client } from '../types';

export const useClients = () => {
  const {
    clients,
    isLoading,
    hasFetched,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    importClients,
    clearError,
  } = useClientsStore();

  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchClients();
    }
  }, [hasFetched, isLoading, fetchClients]);

  const handleCreateClient = (clientData: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => createClient(clientData);
  const handleUpdateClient = (id: string, updates: Partial<Client>) => updateClient(id, updates);
  const handleDeleteClient = (id: string) => deleteClient(id);
  const handleImportClients = (clientsData: any[]) => importClients(clientsData);

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