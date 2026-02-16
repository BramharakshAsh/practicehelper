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
import { Analytics } from "@vercel/analytics/react"

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages - Lazy Loaded
const DashboardPage = lazy(() => import('./legacy-pages/DashboardPage'));
const TasksPage = lazy(() => import('./legacy-pages/TasksPage'));
const ClientsPage = lazy(() => import('./legacy-pages/ClientsPage'));
const StaffPage = lazy(() => import('./legacy-pages/StaffPage'));
const CalendarPage = lazy(() => import('./legacy-pages/CalendarPage'));
const ImportPage = lazy(() => import('./legacy-pages/ImportPage'));
const AutoTasksPage = lazy(() => import('./legacy-pages/AutoTasksPage'));
const CommunicationsPage = lazy(() => import('./legacy-pages/CommunicationsPage'));
const ReportsPage = lazy(() => import('./legacy-pages/ReportsPage'));
const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./legacy-pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./legacy-pages/ResetPasswordPage'));
const AuditDashboard = lazy(() => import('./legacy-pages/AuditDashboard'));
const AuditWorkspace = lazy(() => import('./legacy-pages/AuditWorkspace'));
const DocumentsPage = lazy(() => import('./legacy-pages/DocumentsPage'));
const BillingPage = lazy(() => import('./legacy-pages/BillingPage'));
const SettingsPage = lazy(() => import('./legacy-pages/SettingsPage'));
const CompletedTasksPage = lazy(() => import('./legacy-pages/CompletedTasksPage'));
const UpgradePage = lazy(() => import('./legacy-pages/UpgradePage'));

import LandingPage from './legacy-pages/LandingPage';
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

  const fetchTasks = useTasksStore(state => state.fetchUserTasks);
  const hasFetchedTasks = useTasksStore(state => state.hasFetched);

  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // ── Stable refs to avoid effect re-runs ──
  const navigateRef = React.useRef(navigate);
  navigateRef.current = navigate;

  const lastAccessTokenRef = React.useRef<string | null>(null);

  // Start freeze detector in dev mode
  useEffect(() => { startFreezeDetector(); }, []);

  // Initialize Supabase Realtime subscription for live task sync
  useRealtimeSubscription();

  // Session handler — fetches user profile + firm on valid session
  const handleSession = React.useCallback(async (session: any) => {
    try {
      if (session) {
        // optimistically check if we already have this user loaded to avoid re-fetch
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id === session.user.id) {
          devLog('[App] User already loaded, skipping handling');
          return;
        }

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
  }, [setSession]); /** Stable config, generally safe to include or omit if we trust zustand */

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
          if (session) {
            lastAccessTokenRef.current = session.access_token;
          }
          await handleSessionRef.current(session);
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
  }, []);

  // ── Global auth state change listener ──
  // Uses refs to avoid re-subscribing on every render
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Decoupled async logic
      void (async () => {
        logActivity(`authStateChange: ${event}`);
        devLog('[App] Auth event:', event);

        if (event === 'PASSWORD_RECOVERY') {
          navigateRef.current('/reset-password');
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Token-based debounce
          const newToken = session?.access_token;
          if (newToken && newToken === lastAccessTokenRef.current) {
            devLog('[App] Skipping session refresh — token unchanged');
            return;
          }

          if (session) {
            lastAccessTokenRef.current = session.access_token;
            await handleSessionRef.current(session);
          }
        } else if (event === 'SIGNED_OUT') {
          lastAccessTokenRef.current = null;
          setSession(null, null);
          navigateRef.current('/login');
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array - setSession is stable, refs are stable

  // ── Fix #4: Start/stop idle session check based on auth state ──
  useEffect(() => {
    if (isAuthenticated) {
      startIdleSessionCheck();
    } else {
      stopIdleSessionCheck();
    }
    return () => stopIdleSessionCheck();
  }, [isAuthenticated]);

  // Prefetch data when authenticated - Improved safety
  useEffect(() => {
    let cancelled = false;

    const prefetch = async () => {
      if (!isAuthenticated) return;

      logActivity('prefetch: starting data fetch');
      try {
        await Promise.all([
          !hasFetchedClients && fetchClients(),
          !hasFetchedStaff && fetchStaff(),
          !hasFetchedTasks && fetchTasks(),
        ]);
      } catch (error) {
        devError('[App] Prefetch error:', error);
      }
    };

    if (isAuthenticated) {
      prefetch();
    }

    return () => { cancelled = true; };
  }, [isAuthenticated, hasFetchedClients, hasFetchedStaff, hasFetchedTasks]);

  // Wait for auth initialization to complete
  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <WalkthroughProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
