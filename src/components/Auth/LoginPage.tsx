import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import RegisterOrganizationModal from './RegisterOrganizationModal';

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('partner');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(selectedRole, credentials);
    } catch (error) {
      // Error is handled in the store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-3 mb-2 sm:mb-4">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Firm Flow</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Streamline your firm's workflow</p>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 text-center">Choose Your Role</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => setSelectedRole('partner')}
              className={`p-4 rounded-lg border-2 transition-all flex sm:flex-col items-center sm:justify-center space-x-4 sm:space-x-0 ${selectedRole === 'partner'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              <Building2 className="h-8 w-8 sm:mb-2 flex-shrink-0" />
              <div className="text-left sm:text-center">
                <div className="font-medium">Partner</div>
                <div className="text-xs opacity-75">Full Access</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('manager')}
              className={`p-4 rounded-lg border-2 transition-all flex sm:flex-col items-center sm:justify-center space-x-4 sm:space-x-0 ${selectedRole === 'manager'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              <User className="h-8 w-8 sm:mb-2 flex-shrink-0" />
              <div className="text-left sm:text-center">
                <div className="font-medium">Manager</div>
                <div className="text-xs opacity-75">Team Management</div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <button
              onClick={() => setSelectedRole('staff')}
              className={`p-4 rounded-lg border-2 transition-all flex items-center space-x-4 sm:justify-center sm:space-x-4 ${selectedRole === 'staff'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              <User className="h-8 w-8 flex-shrink-0 sm:mb-0" />
              <div className="text-left sm:text-center">
                <div className="font-medium">Staff</div>
                <div className="text-xs opacity-75">Task Management</div>
              </div>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Username
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3.5 sm:top-3 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3.5 sm:top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 sm:top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" university-link="true" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-sm active:scale-95 transform transition-transform"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                `Login as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Registration Section - Moved Inside Card */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600 mb-3">New Firm to the platform?</p>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 py-2.5 rounded-lg hover:bg-blue-50 transition-all font-bold group shadow-sm active:scale-95 transform transition-transform"
            >
              <Building2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>Register Organization</span>
            </button>
          </div>
        </div>
      </div>

      <RegisterOrganizationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};

export default LoginPage;