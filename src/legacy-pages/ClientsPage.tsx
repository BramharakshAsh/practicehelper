import * as React from 'react';
import { useState, useCallback } from 'react';
import { useClients } from '../hooks/useClients';
import { useCompliance } from '../hooks/useCompliance';
import { useStaff } from '../hooks/useStaff';
import ClientList from '../components/Clients/ClientList';
import ClientAllocation from '../components/Clients/ClientAllocation';
import { Users, UserPlus } from 'lucide-react';

const ClientsPage: React.FC = () => {
    const { clients, createClient, updateClient, deleteClient, refetch: refetchClients } = useClients();
    const { complianceTypes } = useCompliance();
    const { staff } = useStaff();
    const [activeTab, setActiveTab] = useState<'list' | 'allocation'>('list');

    const handleAllocationUpdate = useCallback(async () => {
        await refetchClients();
    }, [refetchClients]);

    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'list'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    Client List
                </button>
                <button
                    onClick={() => setActiveTab('allocation')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'allocation'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <UserPlus className="h-4 w-4" />
                    Client Allocation
                </button>
            </div>

            {activeTab === 'list' ? (
                <ClientList
                    clients={clients}
                    staff={staff}
                    complianceTypes={complianceTypes}
                    onClientUpdate={updateClient}
                    onClientCreate={createClient}
                    onClientDelete={deleteClient}
                />
            ) : (
                <ClientAllocation
                    clients={clients}
                    staff={staff}
                    onAllocationUpdate={handleAllocationUpdate}
                />
            )}
        </div>
    );
};

export default ClientsPage;
