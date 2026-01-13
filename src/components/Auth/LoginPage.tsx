import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import RegisterOrganizationModal from './RegisterOrganizationModal';
import Logo from '../../assets/Logo.png';

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
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex flex-col items-center justify-center mb-6 hover:scale-105 transition-transform">
            <img src={Logo} alt="Firm Flow Logo" className="w-20 h-auto object-contain mb-3" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Firm Flow</h1>
          </Link>
          <p className="text-gray-500 font-medium">Streamline your firm's workflow</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 border border-white p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center italic">Welcome Back</h2>

          {/* Role Selection */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
            {(['partner', 'manager', 'staff'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedRole === role
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Username</label>
              <div className="relative">
                <User className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                  placeholder="name@firm.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" university-link="true" className="text-sm font-bold text-teal-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
            </div>
          )}

          {/* Registration Section */}
          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500 font-medium mb-4">New to Firm Flow?</p>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="text-teal-600 font-bold hover:underline"
            >
              Register your organization today
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