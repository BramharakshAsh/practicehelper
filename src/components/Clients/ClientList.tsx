import React, { useState } from 'react';
import { Plus, Search, Building, Phone, Mail, FileText, CreditCard as Edit, Eye, Filter, Trash2 } from 'lucide-react';
import { Client, ComplianceType, Staff } from '../../types';
import ClientModal from './ClientModal';

interface ClientListProps {
  clients: Client[];
  staff: Staff[];
  complianceTypes: ComplianceType[];
  onClientUpdate: (clientId: string, updates: Partial<Client>) => Promise<void>;
  onClientCreate: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onClientDelete: (clientId: string) => Promise<void>;
}

const ClientList: React.FC<ClientListProps> = ({ clients, staff, complianceTypes, onClientUpdate, onClientCreate, onClientDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.gstin && client.gstin.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesWorkType = filterWorkType === 'all' || client.work_types.includes(filterWorkType);

    return matchesSearch && matchesWorkType;
  });

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search clients by name, PAN or GSTIN..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 flex-1 sm:flex-none">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterWorkType}
              onChange={(e) => setFilterWorkType(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="all">All Work Types</option>
              {complianceTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow relative group flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${client.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {client.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 font-mono uppercase">#{client.id.slice(0, 8)}</span>
              </div>
            </div>

            <div className="mb-4 flex-1">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{client.name}</h3>
              <p className="text-xs text-gray-500 mt-1">PAN: {client.pan}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {client.work_types.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase tracking-tight"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-6 pt-4 border-t border-gray-50">
              {client.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-auto">
              <button
                onClick={() => openModal('view', client)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-blue-600 border border-gray-200"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => openModal('edit', client)}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${client.name}?`)) {
                    onClientDelete(client.id);
                  }
                }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 border border-red-100"
                title="Delete Client"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
          allStaff={staff}
          mode={viewMode}
          onClose={closeModal}
          onSubmit={async (clientData) => {
            if (viewMode === 'create') {
              await onClientCreate(clientData);
            } else if (viewMode === 'edit' && selectedClient) {
              await onClientUpdate(selectedClient.id, clientData);
            }
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default ClientList;