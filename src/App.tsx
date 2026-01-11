import * as React from 'react';
import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useClientsStore } from './store/clients.store';
import { useStaffStore } from './store/staff.store';
import { useTasksStore } from './store/tasks.store';
import { supabase } from './services/supabase';
import { authService } from './services/auth.service';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ClientsPage from './pages/ClientsPage';
import StaffPage from './pages/StaffPage';
import CalendarPage from './pages/CalendarPage';
import ImportPage from './pages/ImportPage';
import AutoTasksPage from './pages/AutoTasksPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './components/Auth/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuditDashboard from './pages/AuditDashboard';
import AuditWorkspace from './pages/AuditWorkspace';

import ErrorBoundary from './components/Common/ErrorBoundary';

function App() {
  const { user, isAuthenticated, setUser } = useAuthStore();
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
      console.log('App: Auth event detected:', event);

      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session) {
          const fetchedUser = await authService.getCurrentUser();
          console.log('App: User profile loaded:', fetchedUser?.email);
          setUser(fetchedUser);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'USER_UPDATED') {
        console.log('App: User updated, bypassing profile fetch for reset flow.');
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
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
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
          path="/"
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
          {/* Catch all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;