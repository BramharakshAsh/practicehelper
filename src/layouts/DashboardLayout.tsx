import * as React from 'react';
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
    LayoutDashboard, Users, UserSquare2, CheckSquare,
    Calendar, PieChart, LogOut, Upload, Zap,
    ClipboardList, Menu, X, HelpCircle
} from 'lucide-react';
import Logo from '../assets/Logo.png';
import { useWalkthrough } from '../components/Walkthrough/WalkthroughProvider';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { restartWalkthrough } = useWalkthrough();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/dashboard/clients', label: 'Clients', icon: Users },
        { to: '/dashboard/staff', label: 'Staff', icon: UserSquare2 },
        { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
        { to: '/dashboard/audits', label: 'Audits', icon: ClipboardList },
        { to: '/dashboard/auto-tasks', label: 'Auto Tasks', icon: Zap },
        { to: '/dashboard/import', label: 'Import', icon: Upload },
        { to: '/dashboard/reports', label: 'Reports', icon: PieChart },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            {/* Premium Top Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[100]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                onClick={toggleMobileMenu}
                                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                            <div className="flex items-center ml-2 lg:ml-0 overflow-hidden group">
                                <img src={Logo} alt="Firm Flow Logo" className="h-10 w-auto object-contain flex-shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline-block">Firm Flow</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-bold text-gray-900 leading-tight">{user?.full_name}</span>
                                <span className="text-xs font-semibold text-teal-600 capitalize leading-tight">{user?.role}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        restartWalkthrough();
                                    }}
                                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all border border-gray-100"
                                    title="Restart Tutorial"
                                >
                                    <HelpCircle className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all border border-gray-100"
                                    title="Logout"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Navigation Tabs */}
                <div className="hidden lg:block border-t border-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-1" aria-label="Tabs">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    data-walkthrough={item.to === '/dashboard/calendar' ? 'calendar-view' : item.to === '/dashboard/audits' ? 'audit-section' : item.to === '/dashboard/import' ? 'import-button' : undefined}
                                    className={({ isActive }) =>
                                        `flex items-center px-5 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${isActive
                                            ? 'border-teal-500 text-teal-600 bg-teal-50/30'
                                            : 'border-transparent text-gray-500 hover:text-teal-600 hover:bg-gray-50/50'
                                        }`
                                    }
                                >
                                    <item.icon className={`h-4.5 w-4.5 mr-2.5 transition-colors`} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[200]">
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
                        onClick={closeMobileMenu}
                        aria-hidden="true"
                    ></div>

                    <div className="relative flex flex-col max-w-xs w-[85%] h-full bg-white shadow-2xl animate-slide-in-left">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center">
                                <img src={Logo} alt="Firm Flow Logo" className="h-10 w-auto" />
                                <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent ml-3">Firm Flow</span>
                            </div>
                            <button
                                onClick={closeMobileMenu}
                                className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 h-0 pt-4 pb-4 overflow-y-auto">
                            <nav className="px-3 space-y-1">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={closeMobileMenu}
                                        className={({ isActive }) =>
                                            `group flex items-center px-4 py-3.5 text-base font-bold rounded-xl transition-all ${isActive
                                                ? 'bg-teal-50 text-teal-700 shadow-sm shadow-teal-500/10'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-teal-600'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <item.icon className={`mr-4 h-5.5 w-5.5 ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-teal-500'}`} />
                                                {item.label}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                        <div className="flex-shrink-0 flex border-t border-gray-100 p-6 bg-gray-50/50">
                            <div className="flex items-center w-full">
                                <div className="h-12 w-12 rounded-2xl bg-teal-100 flex items-center justify-center border border-teal-200 shadow-sm">
                                    <UserSquare2 className="h-7 w-7 text-teal-600" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-base font-bold text-gray-900 leading-tight">{user?.full_name}</p>
                                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mt-0.5">{user?.role}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        restartWalkthrough();
                                    }}
                                    className="p-2.5 rounded-xl bg-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-gray-200 mr-2"
                                    title="Restart Tutorial"
                                >
                                    <HelpCircle className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border border-gray-200"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
