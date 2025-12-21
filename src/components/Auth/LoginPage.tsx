import React, { useState } from 'react';
import { Building2, User, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/auth.store';

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('partner');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">CA Practice Manager</h1>
          </div>
          <p className="text-gray-600">Streamline your practice management</p>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Choose Your Role</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSelectedRole('partner')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedRole === 'partner'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Building2 className="h-8 w-8 mx-auto mb-2" />
              <div className="font-medium">Partner</div>
              <div className="text-sm opacity-75">Full Access</div>
            </button>
            
            <button
              onClick={() => setSelectedRole('manager')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedRole === 'manager'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <User className="h-8 w-8 mx-auto mb-2" />
              <div className="font-medium">Manager</div>
              <div className="text-sm opacity-75">Team Management</div>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            
            <button
              onClick={() => setSelectedRole('staff')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedRole === 'staff'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <User className="h-8 w-8 mx-auto mb-2" />
              <div className="font-medium">Staff</div>
              <div className="text-sm opacity-75">Task Management</div>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                `Login as ${selectedRole === 'partner' ? 'Partner' : 'Staff'}`
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Partner:</strong> admin / admin123</div>
              <div><strong>Manager:</strong> manager / manager123</div>
              <div><strong>Staff:</strong> staff / staff123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;