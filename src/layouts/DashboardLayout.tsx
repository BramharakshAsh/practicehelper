import * as React from 'react';
import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
    LayoutDashboard, Users, UserSquare2, CheckSquare,
    Calendar, PieChart, LogOut, Upload, Zap,
    ClipboardList, Menu, X, HelpCircle,
    FileText, UserCircle, FileCheck, BarChart3, Receipt,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import Logo from '../assets/Logo.png';
import { useWalkthrough } from '../components/Walkthrough/WalkthroughProvider';
import NotificationBell from '../components/Layout/NotificationBell';
import TimerWidget from '../components/TimeTracking/TimerWidget';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { restartWalkthrough } = useWalkthrough();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false); // Optional: if we want collapsible sidebar later

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/dashboard/documents', label: 'Documents', icon: FileText },
        { to: '/dashboard/clients', label: 'Clients', icon: Users },
        { to: '/dashboard/staff', label: 'Staff', icon: UserCircle, roles: ['partner', 'manager'] },
        { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
        { to: '/dashboard/audits', label: 'Audits', icon: FileCheck },
        { to: '/dashboard/auto-tasks', label: 'Auto Tasks', icon: Zap },
        { to: '/dashboard/reports', label: 'Reports', icon: BarChart3, roles: ['partner', 'manager'] },
        { to: '/dashboard/import', label: 'Import', icon: Upload, roles: ['partner', 'manager'] },
        { to: '/dashboard/billing', label: 'Billing', icon: Receipt, roles: ['partner', 'manager'] },
        { to: '/dashboard/settings', label: 'Settings', icon: UserSquare2, roles: ['partner', 'manager'] },
    ].filter(item => !item.roles || item.roles.includes(user?.role || ''));

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // Sidebar Component
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10">
                <img src={Logo} alt="Firm Flow Logo" className="h-8 w-auto object-contain flex-shrink-0" />
                <span className="ml-3 text-lg font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">Firm Flow</span>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeMobileMenu}
                        end={item.to === '/dashboard'} // Only exact match for dashboard
                        data-walkthrough={item.to === '/dashboard/calendar' ? 'calendar-view' : item.to === '/dashboard/audits' ? 'audit-section' : item.to === '/dashboard/import' ? 'import-button' : undefined}
                        className={({ isActive }) =>
                            `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all mb-1 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <div className="flex items-center mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                        <p className="text-xs text-slate-400 capitalize truncate">{user?.role}</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            restartWalkthrough();
                        }}
                        className="flex-1 flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                        title="Restart Tutorial"
                    >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        <span className="text-xs">Help</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span className="text-xs">Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[200]">
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={closeMobileMenu}
                    ></div>
                    <div className="relative flex flex-col w-64 h-full bg-slate-900 shadow-2xl animate-slide-in-left">
                        <SidebarContent />
                        <button
                            onClick={closeMobileMenu}
                            className="absolute top-4 right-[-40px] p-2 bg-white rounded-r-lg text-gray-900 shadow-lg"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300">
                {/* Top Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center">
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-3"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Page Title Logic (Optional) */}
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                            {navItems.find(item => item.to === location.pathname)?.label || 'Dashboard'}
                        </h1>
                        <span className="lg:hidden text-lg font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Firm Flow</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Timer Widget is positioned fixed usually, but we can put a compact version here if needed. 
                           For now, the TimerWidget component is typically fixed bottom right. 
                           I'll leave the TimerWidget component outside, but we can add more header items here. 
                        */}
                        <NotificationBell />
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Fixed Timer Widget */}
            <div className="z-[100]">
                <TimerWidget />
            </div>
        </div>
    );
};

export default DashboardLayout;
