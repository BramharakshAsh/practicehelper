import * as React from 'react';
import { useClients } from '../hooks/useClients';
import { useCompliance } from '../hooks/useCompliance';
import ClientList from '../components/Clients/ClientList';

const ClientsPage: React.FC = () => {
    const { clients, createClient, updateClient, deleteClient } = useClients();
    const { complianceTypes } = useCompliance();

    return (
        <ClientList
            clients={clients}
            complianceTypes={complianceTypes}
            onClientUpdate={updateClient}
            onClientCreate={createClient}
            onClientDelete={deleteClient}
        />
    );
};

export default ClientsPage;
