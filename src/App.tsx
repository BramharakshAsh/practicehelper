import * as React from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useClientsStore } from './store/clients.store';
import { useStaffStore } from './store/staff.store';
import { useTasksStore } from './store/tasks.store';

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
import AuditDashboard from './pages/AuditDashboard';
import AuditWorkspace from './pages/AuditWorkspace';

function App() {
  const { user, isAuthenticated } = useAuthStore();

  // Data initialization (prefetching)
  const { fetchClients } = useClientsStore();
  const { fetchStaff } = useStaffStore();
  const { fetchTasks } = useTasksStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
      fetchStaff();
      fetchTasks();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated && !user && window.location.pathname === '/') {
    // Optional: handle initial load redirect if needed, but Router handles it below
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;