import * as React from 'react';
import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useTasksStore } from '../store/tasks.store';
import {
    LayoutDashboard, Users, UserSquare2, CheckSquare,
    Calendar, LogOut, Upload, Zap,
    Menu, X, HelpCircle,
    UserCircle, FileCheck,
    ChevronLeft, ChevronRight, CheckCircle
} from 'lucide-react';
import { CAControlLogo } from '../components/Common/CAControlLogo';
import { useWalkthrough } from '../components/Walkthrough/WalkthroughProvider';
import NotificationBell from '../components/Layout/NotificationBell';
import TimerWidget from '../components/TimeTracking/TimerWidget';
import { LocalStorageService } from '../services/local-storage.service';
import { DailyClosureModal } from '../components/Tasks/DailyClosureModal';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { restartWalkthrough } = useWalkthrough();
    const { isManualClosureOpen, setManualClosureOpen } = useTasksStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return LocalStorageService.getItem('sidebar-collapsed', false);
    });
    const [showClosureModal, setShowClosureModal] = useState(false);
    const [hasCompletedClosure, setHasCompletedClosure] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    React.useEffect(() => {
        LocalStorageService.setItem('sidebar-collapsed', isSidebarCollapsed);
    }, [isSidebarCollapsed]);

    React.useEffect(() => {
        if (hasCompletedClosure || !user) return;

        // Optionally, skip for partners if they don't have tasks assigned
        // if (user.role === 'partner') return;

        const checkTime = () => {
            const now = new Date();
            const hours = now.getHours();

            // Between 18:00 (6 PM) and 06:00 (6 AM) next morning
            if (hours >= 18 || hours < 6) {
                setShowClosureModal(true);
            } else {
                setShowClosureModal(false);
            }
        };

        checkTime();

        // Check every minute just in case they leave tab open
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, [hasCompletedClosure, user]);

    const navItems = React.useMemo(() => [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/dashboard/completed-tasks', label: 'Completed Tasks', icon: CheckCircle },
        // [HIDDEN TEMPORARILY] { to: '/dashboard/daily-updates', label: 'Daily Updates', icon: CheckSquare, roles: ['partner', 'manager'] },
        // [HIDDEN TEMPORARILY] { to: '/dashboard/reports', label: 'Reports', icon: BarChart2, roles: ['partner', 'manager'] },
        { to: '/dashboard/clients', label: 'Clients', icon: Users },
        { to: '/dashboard/staff', label: 'Staff', icon: UserCircle, roles: ['partner', 'manager'] },
        { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
        { to: '/dashboard/audits', label: 'Audits', icon: FileCheck },
        { to: '/dashboard/auto-tasks', label: 'Auto Tasks', icon: Zap },
        { to: '/dashboard/import', label: 'Import', icon: Upload, roles: ['partner', 'manager'] },
        { to: '/dashboard/settings', label: 'Settings', icon: UserSquare2, roles: ['partner', 'manager'] },
    ].filter(item => !item.roles || item.roles.includes(user?.role || '')), [user?.role]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

    // Sidebar Component
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {/* Logo Area */}
            <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-6'} border-b border-slate-800 bg-slate-900 z-10 transition-all duration-300`}>
                <CAControlLogo size="sm" showText={false} className="flex-shrink-0" />
                {!isSidebarCollapsed && (
                    <span className="ml-3 text-lg font-bold text-brand-primary fade-in">CAControl</span>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeMobileMenu}
                        end={item.to === '/dashboard'} // Only exact match for dashboard
                        data-walkthrough={item.to === '/dashboard/calendar' ? 'calendar-view' : item.to === '/dashboard/audits' ? 'audit-section' : item.to === '/dashboard/import' ? 'import-button' : undefined}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            `flex items-center ${isSidebarCollapsed ? 'justify-center px-1' : 'px-3'} py-2 text-sm font-medium rounded-lg transition-all mb-0.5 ${isActive
                                ? 'bg-brand-primary text-white shadow-lg shadow-orange-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isSidebarCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <div className={`flex items-center mb-4 ${isSidebarCollapsed ? 'justify-center' : 'px-2'}`}>
                    <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                            <p className="text-xs text-slate-400 capitalize truncate">{user?.role}</p>
                        </div>
                    )}
                </div>
                {!isSidebarCollapsed && (
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
                )}
                {isSidebarCollapsed && (
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
            {/* Collapse Toggle */}
            <button
                onClick={toggleSidebar}
                className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-brand-primary text-white rounded-full p-1 shadow-md border border-white hidden lg:flex hover:bg-orange-600"
            >
                {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 relative`}>
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
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
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
                        <span className="lg:hidden text-lg font-bold text-brand-primary">CAControl</span>
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
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 relative">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Fixed Timer Widget */}
            <div className="z-[100]">
                <TimerWidget />
            </div>

            {/* Daily Closure Overlay */}
            <DailyClosureModal
                isOpen={showClosureModal || isManualClosureOpen}
                onlyUnreported={isManualClosureOpen}
                onComplete={() => {
                    if (isManualClosureOpen) {
                        setManualClosureOpen(false);
                    } else {
                        setShowClosureModal(false);
                        setHasCompletedClosure(true);
                    }
                }}
            />
        </div>
    );
};

export default DashboardLayout;
