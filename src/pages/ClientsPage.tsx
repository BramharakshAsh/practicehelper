import * as React from 'react';
import { useClients } from '../hooks/useClients';
import ClientList from '../components/Clients/ClientList';

const ClientsPage: React.FC = () => {
    const { clients, createClient, updateClient } = useClients();

    return (
        <ClientList
            clients={clients}
            onClientUpdate={updateClient}
            onClientCreate={createClient}
        />
    );
};

export default ClientsPage;
