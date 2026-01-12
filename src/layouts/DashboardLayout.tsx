import * as React from 'react';
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
    LayoutDashboard, Users, UserSquare2, CheckSquare,
    Calendar, PieChart, LogOut, Upload, Zap,
    ClipboardList, Menu, X
} from 'lucide-react';
import Logo from '../assets/Logo.png';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { to: '/audits', label: 'Audits', icon: ClipboardList },
        { to: '/auto-tasks', label: 'Auto Tasks', icon: Zap },
        { to: '/import', label: 'Import', icon: Upload },
        { to: '/reports', label: 'Reports', icon: PieChart },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-[100]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                onClick={toggleMobileMenu}
                                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                            <div className="flex items-center ml-2 lg:ml-0 overflow-hidden">
                                <img src={Logo} alt="Firm Flow Logo" className="h-8 sm:h-10 w-auto object-contain flex-shrink-0" />
                                <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline-block">Firm Flow</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="hidden sm:block text-sm text-gray-700">
                                <span className="font-semibold">{user?.full_name}</span> ({user?.role})
                            </div>
                            {/* Mobile user info (role only or shortened) */}
                            <div className="sm:hidden text-xs text-gray-500 font-medium">
                                {user?.role}
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

                {/* Desktop Navigation Tabs */}
                <div className="hidden lg:block border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-1" aria-label="Tabs">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${isActive
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
                </div>

                {/* Mobile Navigation Drawer */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-[200] flex">
                        <div
                            className="fixed inset-0 bg-gray-600 bg-opacity-75"
                            onClick={closeMobileMenu}
                        ></div>
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button
                                    onClick={closeMobileMenu}
                                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                >
                                    <X className="h-6 w-6 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                                <div className="flex-shrink-0 flex items-center px-4">
                                    <img src={Logo} alt="Firm Flow Logo" className="h-10 w-auto object-contain" />
                                    <span className="text-xl font-bold text-gray-900 ml-2">Firm Flow</span>
                                </div>
                                <nav className="mt-5 px-2 space-y-1">
                                    {navItems.map((item) => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            onClick={closeMobileMenu}
                                            className={({ isActive }) =>
                                                `group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${isActive
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`
                                            }
                                        >
                                            <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                            {item.label}
                                        </NavLink>
                                    ))}
                                </nav>
                            </div>
                            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                                <div className="flex-shrink-0 group block">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <UserSquare2 className="h-6 w-6 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-base font-medium text-gray-700">{user?.full_name}</p>
                                            <p className="text-sm font-medium text-gray-500">{user?.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
