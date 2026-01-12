import * as React from 'react';
import { useClients } from '../hooks/useClients';
import { useCompliance } from '../hooks/useCompliance';
import { useStaff } from '../hooks/useStaff';
import ClientList from '../components/Clients/ClientList';

const ClientsPage: React.FC = () => {
    const { clients, createClient, updateClient, deleteClient } = useClients();
    const { complianceTypes } = useCompliance();
    const { staff } = useStaff();

    return (
        <ClientList
            clients={clients}
            staff={staff}
            complianceTypes={complianceTypes}
            onClientUpdate={updateClient}
            onClientCreate={createClient}
            onClientDelete={deleteClient}
        />
    );
};

export default ClientsPage;
