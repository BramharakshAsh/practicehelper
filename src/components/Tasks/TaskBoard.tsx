import React, { useState } from 'react';
import { Plus, Filter, Search, AlertTriangle } from 'lucide-react';
import { Task, Staff, Client, ComplianceType, UserRole } from '../../types';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

interface TaskBoardProps {
  tasks: Task[];
  staff: Staff[];
  clients: Client[];
  complianceTypes: ComplianceType[];
  currentRole: UserRole;
  currentStaffId?: string;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => void;
  onTaskDelete: (taskId: string) => void;
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
  onTaskDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterComplianceType, setFilterComplianceType] = useState('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
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

  if (filterPriority !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
  }

  if (filterComplianceType !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.compliance_type_id === filterComplianceType);
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
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'board' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              List
            </button>
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

            {(currentRole === 'partner' || currentRole === 'manager') && (
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

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <select
              value={filterComplianceType}
              onChange={(e) => setFilterComplianceType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Compliance Types</option>
              {Object.entries(
                complianceTypes.reduce((acc, type) => {
                  if (!acc[type.category]) acc[type.category] = [];
                  acc[type.category].push(type);
                  return acc;
                }, {} as Record<string, typeof complianceTypes>)
              ).map(([category, types]) => (
                <optgroup key={category} label={category}>
                  {types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task Board / List */}
      {viewMode === 'board' ? (
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
                    onDelete={onTaskDelete}
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
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taskStatuses.map(status => (
                <React.Fragment key={status.value}>
                  {groupedTasks[status.value]?.length > 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {status.label} ({status.count})
                      </td>
                    </tr>
                  )}
                  {groupedTasks[status.value]?.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{task.client?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{task.staff?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.status === 'filed_completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'ready_for_review' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'awaiting_client_data' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${new Date(task.due_date) < new Date() && task.status !== 'filed_completed' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No tasks found matching your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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