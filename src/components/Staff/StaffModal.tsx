import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Calendar, Check, Copy, Key } from 'lucide-react';
import { Staff, UserRole } from '../../types';
import { useAuthStore } from '../../store/auth.store';

interface StaffModalProps {
  staff?: Staff;
  allStaff?: Staff[];
  onClose: () => void;
  onSubmit: (staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
}

const StaffModal: React.FC<StaffModalProps> = ({ staff, allStaff = [], onClose, onSubmit, mode }) => {
  const { user: currentUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || 'paid_staff' as Staff['role'],
    is_active: staff?.is_active ?? true,
    date_of_joining: staff?.date_of_joining || new Date().toISOString().split('T')[0],
    manager_id: staff?.manager_id || '',
  });

  const [generateCredentials, setGenerateCredentials] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    if (mode === 'create' && !generateCredentials) {
      alert('Please generate login credentials for the new staff member');
      return;
    }

    if (generateCredentials && !generatedPassword) {
      alert('Please generate a password');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        password: generateCredentials ? generatedPassword : undefined
      });
    } catch (err: any) {
      console.error('[StaffModal] Submission error:', err);
      setError(err.message || 'An error occurred while saving staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const isReadOnly = mode === 'view';

  const getRoleLabel = (role: Staff['role']) => {
    switch (role) {
      case 'partner':
        return 'Partner';
      case 'manager':
        return 'Manager';
      case 'paid_staff':
        return 'Paid Staff';
      case 'articles':
        return 'Articles';
      default:
        return role;
    }
  };

  const managers = allStaff.filter(s => s.role === 'manager' || s.role === 'partner');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Staff Member' : mode === 'edit' ? 'Edit Staff Member' : 'Staff Details'}
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
                <User className="h-4 w-4 inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
                required
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="staff@example.com"
                required
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 98765 43210"
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 inline mr-2" />
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isReadOnly}
              >
                <option value="paid_staff">Paid Staff</option>
                <option value="articles">Articles</option>
                <option value="manager">Manager</option>
                <option value="partner">Partner</option>
              </select>
            </div>
          </div>

          {currentUser?.role === 'partner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 inline mr-2 text-blue-500" />
                  Assign to Manager
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
                <p className="mt-1 text-xs text-gray-500">Managers can manage tasks and staff assigned to them.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Date of Joining *
              </label>
              <input
                type="date"
                name="date_of_joining"
                value={formData.date_of_joining}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isReadOnly}
              />
              <span className="text-sm text-gray-700">Active Staff Member</span>
            </label>

            {mode === 'create' && !isReadOnly && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateCredentials}
                    onChange={(e) => {
                      setGenerateCredentials(e.target.checked);
                      if (e.target.checked && !generatedPassword) {
                        handleGeneratePassword();
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Generate Login Credentials</span>
                </label>

                {generateCredentials && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">A temporary password will be generated for the staff member.</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm">
                        {generatedPassword}
                      </div>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy password"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Regenerate password"
                      >
                        <Key className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isReadOnly && (
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                <span>{mode === 'create' ? 'Add Staff Member' : 'Update Staff Member'}</span>
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

export default StaffModal;