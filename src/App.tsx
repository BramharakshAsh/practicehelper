import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useClientsStore } from './store/clients.store';
import { useStaffStore } from './store/staff.store';
import { useTasksStore } from './store/tasks.store';
import { supabase } from './services/supabase';
import { authService } from './services/auth.service';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages - Lazy Loaded
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const AutoTasksPage = lazy(() => import('./pages/AutoTasksPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AuditDashboard = lazy(() => import('./pages/AuditDashboard'));
const AuditWorkspace = lazy(() => import('./pages/AuditWorkspace'));

import LandingPage from './pages/LandingPage';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { SessionTimeout } from './components/Auth/SessionTimeout';


// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  // Data initialization (prefetching)
  const { fetchClients } = useClientsStore();
  const { fetchStaff } = useStaffStore();
  const { fetchTasks } = useTasksStore();

  const navigate = useNavigate();

  useEffect(() => {
    // 1. Initial check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = await authService.getCurrentUser();
        setUser(user);
      }
    };
    initAuth();

    // 2. Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('App: Auth event detected:', event);

      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session) {
          const fetchedUser = await authService.getCurrentUser();
          // console.log('App: User profile loaded:', fetchedUser?.email);
          setUser(fetchedUser);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'USER_UPDATED') {
        // console.log('App: User updated, bypassing profile fetch for reset flow.');
        return;
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
      fetchStaff();
      fetchTasks();
    }
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <SessionTimeout />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />

          <Route
            path="/dashboard"
            element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}
          >
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="auto-tasks" element={<AutoTasksPage />} />
            <Route path="audits" element={<AuditDashboard />} />
            <Route path="audits/:id" element={<AuditWorkspace />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;