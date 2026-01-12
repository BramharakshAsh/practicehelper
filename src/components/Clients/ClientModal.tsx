import React, { useState } from 'react';
import { X, Building, Phone, Mail, FileText, CreditCard } from 'lucide-react';
import { Client, Staff } from '../../types';
import { useAuthStore } from '../../store/auth.store';

interface ClientModalProps {
  client?: Client;
  allStaff?: Staff[];
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  mode: 'create' | 'edit' | 'view';
}

const ClientModal: React.FC<ClientModalProps> = ({ client, allStaff = [], onClose, onSubmit, mode }) => {
  const { user: currentUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: client?.name || '',
    gstin: client?.gstin || '',
    pan: client?.pan || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    work_types: client?.work_types || [],
    manager_id: client?.manager_id || '',
  });

  const getRoleLabel = (role: Staff['role']) => {
    switch (role) {
      case 'partner': return 'Partner';
      case 'manager': return 'Manager';
      case 'paid_staff': return 'Paid Staff';
      case 'articles': return 'Articles';
      default: return role;
    }
  };

  const managers = allStaff.filter(s => s.role === 'manager' || s.role === 'partner');

  const workTypeOptions = ['GST', 'TDS', 'IT', 'ROC', 'Audit', 'Accounting'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.pan) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.work_types.length === 0) {
      alert('Please select at least one work type');
      return;
    }

    const normalizedData = {
      ...formData,
      name: formData.name.trim(),
      pan: formData.pan.trim().toUpperCase(),
      gstin: formData.gstin.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
    };

    onSubmit(normalizedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkTypeChange = (workType: string) => {
    setFormData(prev => ({
      ...prev,
      work_types: prev.work_types.includes(workType)
        ? prev.work_types.filter(type => type !== workType)
        : [...prev.work_types, workType]
    }));
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Client' : mode === 'edit' ? 'Edit Client' : 'Client Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Client Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter client name"
                required
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-2" />
                PAN Number *
              </label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABCDE1234F"
                required
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN Number
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="29ABCDE1234F1Z5"
              readOnly={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@example.com"
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {currentUser?.role === 'partner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="h-4 w-4 inline mr-2 text-blue-500" />
                  Assigned Manager
                </label>
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isReadOnly}
                >
                  <option value="">No Manager (Unassigned)</option>
                  {managers.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name} ({getRoleLabel(m.role)})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">The assigned manager will be able to manage this client's tasks.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter client address"
              readOnly={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FileText className="h-4 w-4 inline mr-2" />
              Work Types *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {workTypeOptions.map((workType) => (
                <label key={workType} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.work_types.includes(workType)}
                    onChange={() => handleWorkTypeChange(workType)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isReadOnly}
                  />
                  <span className="text-sm text-gray-700">{workType}</span>
                </label>
              ))}
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {mode === 'create' ? 'Create Client' : 'Update Client'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ClientModal;