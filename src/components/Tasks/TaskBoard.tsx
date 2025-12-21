import React, { useState } from 'react';
import { Plus, Filter, Search, User, Building, Calendar, AlertTriangle } from 'lucide-react';
import { Task, Staff, Client, ComplianceType } from '../../types';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

interface TaskBoardProps {
  tasks: Task[];
  staff: Staff[];
  clients: Client[];
  complianceTypes: ComplianceType[];
  currentRole: 'partner' | 'staff';
  currentStaffId?: string;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  staff,
  clients,
  complianceTypes,
  currentRole,
  currentStaffId,
  onTaskUpdate,
  onTaskCreate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const taskStatuses = [
    { value: 'assigned', label: 'Assigned', count: 0 },
    { value: 'in_progress', label: 'In Progress', count: 0 },
    { value: 'awaiting_client_data', label: 'Awaiting Client Data', count: 0 },
    { value: 'ready_for_review', label: 'Ready for Review', count: 0 },
    { value: 'filed_completed', label: 'Filed/Completed', count: 0 },
  ];

  // Filter tasks based on current role
  let filteredTasks = tasks;
  if (currentRole === 'staff' && currentStaffId) {
    filteredTasks = tasks.filter(task => task.staff_id === currentStaffId);
  }

  // Apply filters
  if (searchTerm) {
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.staff?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterStatus !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.status === filterStatus);
  }

  if (filterStaff !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.staff_id === filterStaff);
  }

  // Count tasks by status
  taskStatuses.forEach(status => {
    status.count = filteredTasks.filter(task => task.status === status.value).length;
  });

  const groupedTasks = taskStatuses.reduce((acc, status) => {
    acc[status.value] = filteredTasks.filter(task => task.status === status.value);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentRole === 'staff' ? 'My Tasks' : 'Task Management'}
          </h2>
          <p className="text-gray-600 mt-1">
            {currentRole === 'staff' 
              ? 'View and manage your assigned tasks'
              : 'Manage and track all tasks across your practice'
            }
          </p>
        </div>
        {currentRole === 'partner' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, clients, or staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {taskStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label} ({status.count})
                </option>
              ))}
            </select>
            
            {currentRole === 'partner' && (
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Staff</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {taskStatuses.map((status) => (
          <div key={status.value} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{status.label}</h3>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                {status.count}
              </span>
            </div>
            
            <div className="space-y-3">
              {groupedTasks[status.value]?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onTaskUpdate}
                  currentRole={currentRole}
                />
              ))}
              
              {groupedTasks[status.value]?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Creation Modal */}
      {showModal && (
        <TaskModal
          staff={staff}
          clients={clients}
          complianceTypes={complianceTypes}
          onClose={() => setShowModal(false)}
          onSubmit={onTaskCreate}
        />
      )}
    </div>
  );
};

export default TaskBoard;