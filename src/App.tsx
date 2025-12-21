import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/auth.store';
import { useClients } from './hooks/useClients';
import { useStaff } from './hooks/useStaff';
import { useTasks } from './hooks/useTasks';
import { useCompliance } from './hooks/useCompliance';
import { UserRole } from './types';

// Components
import LoginPage from './components/Auth/LoginPage';
import Header from './components/Layout/Header';
import DashboardStats from './components/Dashboard/DashboardStats';
import RecentTasks from './components/Dashboard/RecentTasks';
import TaskBoard from './components/Tasks/TaskBoard';
import ClientList from './components/Clients/ClientList';
import StaffList from './components/Staff/StaffList';
import CalendarView from './components/Calendar/CalendarView';
import ImportModal from './components/Import/ImportModal';
import AutoTaskModal from './components/Tasks/AutoTaskModal';

function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewAsRole, setViewAsRole] = useState<UserRole>('partner');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'clients' | 'staff' | 'tasks'>('clients');
  const [showAutoTaskModal, setShowAutoTaskModal] = useState(false);

  // Hooks for data management
  const { clients, createClient, updateClient, importClients } = useClients();
  const { staff, createStaff, updateStaff, importStaff } = useStaff();
  const { tasks, createTask, updateTask, createBulkTasks, importTasks } = useTasks();
  const { complianceTypes } = useCompliance();

  // Set initial view based on user role
  useEffect(() => {
    if (user) {
      setViewAsRole(user.role);
      setCurrentView(user.role === 'partner' ? 'dashboard' : 'my-tasks');
    }
  }, [user]);

  // Show login page if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Import handlers
  const handleImport = async (type: 'clients' | 'staff' | 'tasks', data: any[]) => {
    try {
      switch (type) {
        case 'clients':
          await importClients(data);
          break;
        case 'staff':
          await importStaff(data);
          break;
        case 'tasks':
          // Process task data to match client and staff
          const processedTasks = data.map(item => {
            const client = clients.find(c => c.name === item.client_name);
            const staffMember = staff.find(s => s.name === item.staff_name);
            const complianceType = complianceTypes.find(ct => ct.name === item.compliance_type);
            
            return {
              ...item,
              client_id: client?.id || '',
              staff_id: staffMember?.id || '',
              compliance_type_id: complianceType?.id || '',
              status: 'assigned' as const,
              assigned_by: user.id,
            };
          });
          await importTasks(processedTasks);
          break;
      }
    } catch (error) {
      console.error('Import failed:', error);
      // Error handling is done in the hooks/stores
    }
  };

  const handleAutoTaskGeneration = async (newTasks: any[]) => {
    try {
      const tasksWithAssignment = newTasks.map(task => ({
        ...task,
        assigned_by: user.id,
      }));
      await createBulkTasks(tasksWithAssignment);
    } catch (error) {
      console.error('Auto task generation failed:', error);
    }
  };

  const renderContent = () => {
    const currentRole = viewAsRole;
    const currentStaffId = user.role === 'staff' ? user.id : undefined;

    // Staff role views
    if (currentRole === 'staff') {
      switch (currentView) {
        case 'my-tasks':
          return (
            <TaskBoard
              tasks={tasks}
              staff={staff}
              clients={clients}
              complianceTypes={complianceTypes}
              currentRole={currentRole}
              currentStaffId={currentStaffId}
              onTaskUpdate={updateTask}
              onTaskCreate={createTask}
            />
          );
        case 'calendar':
          return (
            <CalendarView
              tasks={tasks}
              currentRole={currentRole}
              currentStaffId={currentStaffId}
            />
          );
        case 'clients':
          return (
            <ClientList
              clients={clients}
              onClientUpdate={updateClient}
              onClientCreate={createClient}
            />
          );
        default:
          return (
            <TaskBoard
              tasks={tasks}
              staff={staff}
              clients={clients}
              complianceTypes={complianceTypes}
              currentRole={currentRole}
              currentStaffId={currentStaffId}
              onTaskUpdate={updateTask}
              onTaskCreate={createTask}
            />
          );
      }
    }

    // Partner role views
    switch (currentView) {
      case 'dashboard':
        const recentTasks = tasks.slice(0, 5);
        const urgentTasks = tasks.filter(task => {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7 && task.status !== 'filed_completed';
        });

        const dashboardStats = {
          total_clients: clients.length,
          total_staff: staff.length,
          overdue_tasks: tasks.filter(task => new Date(task.due_date) < new Date() && task.status !== 'filed_completed').length,
          pending_review: tasks.filter(task => task.status === 'ready_for_review').length,
          completed_today: tasks.filter(task => {
            const today = new Date().toDateString();
            return task.status === 'filed_completed' && new Date(task.updated_at).toDateString() === today;
          }).length,
          upcoming_due_dates: urgentTasks.length,
        };
        
        return (
          <div className="space-y-8">
            <DashboardStats stats={dashboardStats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentTasks tasks={recentTasks} title="Recent Tasks" />
              <RecentTasks tasks={urgentTasks} title="Urgent Tasks (Next 7 Days)" />
            </div>
          </div>
        );
        
      case 'clients':
        return (
          <ClientList
            clients={clients}
            onClientUpdate={updateClient}
            onClientCreate={createClient}
          />
        );
        
      case 'staff':
        return (
          <StaffList
            staff={staff}
            onStaffUpdate={updateStaff}
            onStaffCreate={createStaff}
          />
        );
        
      case 'tasks':
        return (
          <TaskBoard
            key="partner-tasks"
            tasks={tasks}
            staff={staff}
            clients={clients}
            complianceTypes={complianceTypes}
            currentRole={currentRole}
            onTaskUpdate={updateTask}
            onTaskCreate={createTask}
          />
        );
          
      case 'import':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Data</h2>
              <p className="text-gray-600 mt-1">Import clients, staff, and tasks from Excel/CSV files</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { type: 'clients' as const, title: 'Import Clients', desc: 'Upload client master data' },
                { type: 'staff' as const, title: 'Import Staff', desc: 'Upload staff member data' },
                { type: 'tasks' as const, title: 'Import Tasks', desc: 'Upload task assignments' }
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => { setImportType(item.type); setShowImportModal(true); }}
                  className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <CalendarView
            tasks={tasks}
            currentRole={currentRole}
          />
        );
      
      case 'auto-tasks':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Auto Task Generation</h2>
              <p className="text-gray-600 mt-1">Automatically generate monthly compliance tasks</p>
            </div>
            
            <button
              onClick={() => setShowAutoTaskModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Monthly Tasks
            </button>
          </div>
        );
        
      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
              <p className="text-gray-600 mt-1">Comprehensive insights into your practice performance</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-600">Advanced reporting and analytics features will be available in the next release.</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-8">
            <DashboardStats stats={{
              total_clients: clients.length,
              total_staff: staff.length,
              overdue_tasks: 0,
              pending_review: 0,
              completed_today: 0,
              upcoming_due_dates: 0,
            }} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentTasks tasks={tasks.slice(0, 5)} title="Recent Tasks" />
              <RecentTasks 
                tasks={tasks.filter(task => task.status === 'ready_for_review')} 
                title="Pending Review" 
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        key={`header-${viewAsRole}`}
        currentRole={viewAsRole}
        userRole={user.role}
        onRoleChange={setViewAsRole}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={logout}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>
      
      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          type={importType}
          onClose={() => setShowImportModal(false)}
          onImport={(data) => {
            handleImport(importType, data);
            setShowImportModal(false);
          }}
        />
      )}
      
      {/* Auto Task Modal */}
      {showAutoTaskModal && (
        <AutoTaskModal
          clients={clients}
          staff={staff}
          complianceTypes={complianceTypes}
          onClose={() => setShowAutoTaskModal(false)}
          onGenerate={handleAutoTaskGeneration}
        />
      )}
    </div>
  );
}

export default App;