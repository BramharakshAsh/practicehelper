import { useEffect, Suspense, lazy, useState } from 'react';
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
const CommunicationsPage = lazy(() => import('./pages/CommunicationsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AuditDashboard = lazy(() => import('./pages/AuditDashboard'));
const AuditWorkspace = lazy(() => import('./pages/AuditWorkspace'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CompletedTasksPage = lazy(() => import('./pages/CompletedTasksPage'));

import LandingPage from './pages/LandingPage';
import ErrorBoundary from './components/Common/ErrorBoundary';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { SessionTimeout } from './components/Auth/SessionTimeout';


// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

import { WalkthroughProvider } from './components/Walkthrough/WalkthroughProvider';

function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  // Data initialization (prefetching)
  const { fetchClients, hasFetched: hasFetchedClients } = useClientsStore();
  const { fetchStaff, hasFetched: hasFetchedStaff } = useStaffStore();
  const { fetchTasks, hasFetched: hasFetchedTasks } = useTasksStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // 1. Initial Auth Check (Run once)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session) {
            const user = await authService.getCurrentUser();
            setUser(user);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('App: Initial auth check failed:', error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, [setUser]);

  // 2. Auth State Change Listener (Run once)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App: Auth event detected:', event);

      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session) {
          const fetchedUser = await authService.getCurrentUser();
          setUser(fetchedUser);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setUser]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!hasFetchedClients) fetchClients();
      if (!hasFetchedStaff) fetchStaff();
      if (!hasFetchedTasks) fetchTasks();
    }
  }, [isAuthenticated, fetchClients, fetchStaff, fetchTasks, hasFetchedClients, hasFetchedStaff, hasFetchedTasks]);

  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <WalkthroughProvider>
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
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="auto-tasks" element={<AutoTasksPage />} />
              <Route path="communications" element={<CommunicationsPage />} />
              <Route path="completed-tasks" element={<CompletedTasksPage />} />
              <Route path="audits" element={<AuditDashboard />} />
              <Route path="audits/:auditId" element={<AuditWorkspace />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="billing" element={
                <ProtectedRoute roles={['partner', 'manager', 'paid_staff', 'staff']}>
                  <BillingPage />
                </ProtectedRoute>
              } />
              <Route path="reports" element={
                <ProtectedRoute roles={['partner', 'manager']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute roles={['partner', 'manager']}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch all redirect to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </WalkthroughProvider>
    </ErrorBoundary>
  );
}

export default App;