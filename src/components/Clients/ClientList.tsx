import React, { useState } from 'react';
import { Plus, Search, Building, Phone, Mail, FileText, CreditCard as Edit, Eye } from 'lucide-react';
import { Client } from '../../types';
import ClientModal from './ClientModal';

interface ClientListProps {
  clients: Client[];
  onClientUpdate: (clientId: string, updates: Partial<Client>) => void;
  onClientCreate: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onClientUpdate, onClientCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.gstin && client.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openModal = (mode: 'create' | 'edit' | 'view', client?: Client) => {
    setViewMode(mode);
    setSelectedClient(client || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  const formatWorkTypes = (workTypes: string[]) => {
    return workTypes.join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600 mt-1">Manage your client information and work assignments</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name, PAN, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-600">PAN: {client.pan}</p>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => openModal('view', client)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Eye className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={() => openModal('edit', client)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {client.gstin && (
                <p className="text-sm text-gray-600">GSTIN: {client.gstin}</p>
              )}
              
              {client.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-3 w-3" />
                  <span>{client.email}</span>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-3 w-3 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Work Types:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {client.work_types.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => openModal('create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Client
            </button>
          )}
        </div>
      )}

      {/* Modal would go here - simplified for this example */}
      {showModal && (
        <ClientModal
          client={selectedClient || undefined}
          mode={viewMode}
          onClose={closeModal}
          onSubmit={(clientData) => {
            if (viewMode === 'create') {
              onClientCreate(clientData);
            } else if (viewMode === 'edit' && selectedClient) {
              onClientUpdate(selectedClient.id, clientData);
            }
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default ClientList;