import * as React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { LayoutDashboard, Users, UserSquare2, CheckSquare, Calendar, PieChart, LogOut, Upload, Zap } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/clients', label: 'Clients', icon: Users },
        { to: '/staff', label: 'Staff', icon: UserSquare2 },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
        { to: '/auto-tasks', label: 'Auto Tasks', icon: Zap },
        { to: '/import', label: 'Import', icon: Upload },
        { to: '/reports', label: 'Reports', icon: PieChart },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-gray-900">CA Practice Manager</span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-700">
                                <span className="font-semibold">{user?.full_name}</span> ({user?.role})
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
                    <nav className="flex space-x-1" aria-label="Tabs">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`
                                }
                            >
                                <item.icon className="h-4 w-4 mr-2" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
