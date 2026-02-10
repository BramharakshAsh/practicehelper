import React, { useEffect, Suspense, lazy, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useClientsStore } from './store/clients.store';
import { useStaffStore } from './store/staff.store';
import { useTasksStore } from './store/tasks.store';
import { supabase, startIdleSessionCheck, stopIdleSessionCheck } from './services/supabase';
import { devLog, devWarn, devError } from './services/logger';
import { startFreezeDetector, logActivity } from './services/freeze-detector';
import { authService } from './services/auth.service';
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';

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
const UpgradePage = lazy(() => import('./pages/UpgradePage'));

import LandingPage from './pages/LandingPage';
import ErrorBoundary from './components/Common/ErrorBoundary';
import ProtectedRoute from './components/Common/ProtectedRoute';


// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

import { WalkthroughProvider } from './components/Walkthrough/WalkthroughProvider';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setSession = useAuthStore(state => state.setSession);

  // Data initialization (prefetching) hooks with specific selectors
  const fetchClients = useClientsStore(state => state.fetchClients);
  const hasFetchedClients = useClientsStore(state => state.hasFetched);

  const fetchStaff = useStaffStore(state => state.fetchStaff);
  const hasFetchedStaff = useStaffStore(state => state.hasFetched);

  const fetchTasks = useTasksStore(state => state.fetchTasks);
  const hasFetchedTasks = useTasksStore(state => state.hasFetched);

  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // ── Stable refs to avoid effect re-runs ──
  const navigateRef = React.useRef(navigate);
  navigateRef.current = navigate;

  const lastSessionHandledRef = React.useRef(0);

  // Start freeze detector in dev mode
  useEffect(() => { startFreezeDetector(); }, []);

  // Initialize Supabase Realtime subscription for live task sync
  useRealtimeSubscription();

  // Session handler — fetches user profile + firm on valid session
  const handleSession = React.useCallback(async (session: any) => {
    try {
      if (session) {
        logActivity('handleSession: fetching user');
        const user = await authService.getCurrentUser();

        if (!user) {
          devWarn('[App] Session exists but user fetch failed — clearing auth');
          setSession(null, null);
          return;
        }

        let firm = null;
        if (user.firm_id) {
          try {
            firm = await authService.getFirm(user.firm_id);
          } catch (e) {
            devError('[App] Failed to fetch firm', e);
          }
        }
        logActivity('handleSession: setting session (user+firm)');
        setSession(user, firm);
      } else {
        logActivity('handleSession: no session, clearing');
        setSession(null, null);
      }
    } catch (error: any) {
      devError('[App] Session handling failed:', error);
      setSession(null, null);
    }
  }, [setSession]);

  const handleSessionRef = React.useRef(handleSession);
  handleSessionRef.current = handleSession;

  // ── Auth initialization ──
  // On mount, get session from Supabase and set auth state.
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      devLog('[App] Starting auth initialization...');
      logActivity('initAuth: starting');

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          await handleSessionRef.current(session);
          lastSessionHandledRef.current = Date.now();
        }
      } catch (error) {
        devError('[App] Initial auth check failed:', error);
        if (mounted) setSession(null, null);
      } finally {
        if (mounted) {
          devLog('[App] Initialization complete');
          setIsInitialized(true);
        }
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, []); // Empty deps — runs exactly once on mount

  // ── Global auth state change listener ──
  // Uses refs to avoid re-subscribing on every render
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logActivity(`authStateChange: ${event}`);
      devLog('[App] Auth event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        navigateRef.current('/reset-password');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Debounce: skip if we handled a session within the last 5 seconds
        // This prevents the infinite loop: TOKEN_REFRESHED → handleSession → getUser → refresh → TOKEN_REFRESHED
        const now = Date.now();
        if (now - lastSessionHandledRef.current < 5000) {
          devLog('[App] Skipping session refresh — handled recently');
          return;
        }

        if (session) {
          lastSessionHandledRef.current = now;
          await handleSessionRef.current(session);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null, null);
        navigateRef.current('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]); // Only depends on stable Zustand action

  // ── Fix #4: Start/stop idle session check based on auth state ──
  useEffect(() => {
    if (isAuthenticated) {
      startIdleSessionCheck();
    } else {
      stopIdleSessionCheck();
    }
    return () => stopIdleSessionCheck();
  }, [isAuthenticated]);

  // Prefetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logActivity('prefetch: starting data fetch');
      if (!hasFetchedClients) fetchClients();
      if (!hasFetchedStaff) fetchStaff();
      if (!hasFetchedTasks) fetchTasks();
    }
  }, [isAuthenticated, fetchClients, fetchStaff, fetchTasks, hasFetchedClients, hasFetchedStaff, hasFetchedTasks]);

  // Wait for auth initialization to complete
  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <WalkthroughProvider>
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
              <Route path="upgrade" element={<UpgradePage />} />
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