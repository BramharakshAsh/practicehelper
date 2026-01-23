import React, { useState } from 'react';
import { X, Building, Mail, FileText, CreditCard } from 'lucide-react';
import { Client, Staff } from '../../types';
import { useAuthStore } from '../../store/auth.store';

interface ClientModalProps {
  client?: Client;
  allStaff?: Staff[];
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

const ClientModal: React.FC<ClientModalProps> = ({ client, allStaff = [], onClose, onSubmit, mode }) => {
  const { user: currentUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: client?.name || '',
    gstin: client?.gstin || '',
    pan: client?.pan || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    work_types: client?.work_types || [],
    manager_id: client?.manager_id || '',
    client_group: client?.client_group || '',
    instructions: client?.instructions || '',
    to_remember: client?.to_remember || '',
    auto_mail_enabled: client?.auto_mail_enabled || false,
    mail_frequency: client?.mail_frequency || 'none' as 'monthly' | 'quarterly' | 'none',
    is_active: client?.is_active ?? true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.pan) {
      setError('Name and PAN are required');
      return;
    }

    if (formData.work_types.length === 0) {
      setError('Please select at least one work type');
      return;
    }

    const normalizedData = {
      ...formData,
      name: formData.name.trim(),
      pan: formData.pan.trim().toUpperCase(),
      gstin: formData.gstin.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      client_group: formData.client_group.trim() || undefined,
      instructions: formData.instructions.trim() || undefined,
      to_remember: formData.to_remember.trim() || undefined,
      auto_mail_enabled: formData.auto_mail_enabled,
      mail_frequency: formData.mail_frequency,
      is_active: formData.is_active,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(normalizedData);
    } catch (err: any) {
      console.error('[ClientModal] Submission error:', err);
      setError(err.message || 'An error occurred while saving client');
      setIsSubmitting(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative flex items-center space-x-2">
              <span className="text-sm">{error}</span>
            </div>
          )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Group
              </label>
              <input
                type="text"
                name="client_group"
                value={formData.client_group}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Retailers, HNIs"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-bold text-blue-600">
                Special Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={4}
                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30 font-medium"
                placeholder="Important client-specific handling instructions..."
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-bold text-orange-600">
                Points To Remember
              </label>
              <textarea
                name="to_remember"
                value={formData.to_remember}
                onChange={handleChange}
                rows={4}
                className="w-full border-2 border-orange-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-orange-50/30 font-medium"
                placeholder="Key things to keep in mind for this client..."
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-blue-600" />
              Automated Communication (Resend)
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto Task Reminders</p>
                  <p className="text-xs text-gray-500">Send automatic emails when tasks are created or due</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_mail_enabled}
                    onChange={(e) => setFormData({ ...formData, auto_mail_enabled: e.target.checked })}
                    disabled={isReadOnly}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.auto_mail_enabled && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Internal Update Frequency</label>
                  <select
                    name="mail_frequency"
                    value={formData.mail_frequency}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="none">No Reports</option>
                    <option value="monthly">Monthly Status Report</option>
                    <option value="quarterly">Quarterly Compliance Review</option>
                  </select>
                </div>
              )}
            </div>
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
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                <span>{mode === 'create' ? 'Create Client' : 'Update Client'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
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