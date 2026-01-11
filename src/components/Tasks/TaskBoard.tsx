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

  const isStaffView = ['staff', 'paid_staff', 'articles'].includes(currentRole);

  // Filter tasks based on current role
  let filteredTasks = tasks;
  if (isStaffView && currentStaffId) {
    filteredTasks = tasks.filter(task =>
      task.staff_id === currentStaffId ||
      task.assigned_by === currentStaffId
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isStaffView ? 'My Tasks' : 'Task Management'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isStaffView
              ? 'View and manage your tasks'
              : 'Manage and track all tasks across your practice'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg flex-1 sm:flex-none">
            <button
              onClick={() => setViewMode('board')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'board' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              List
            </button>
          </div>
          {['partner', 'manager', 'staff', 'paid_staff', 'articles'].includes(currentRole) && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-none text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="relative w-full">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, clients, or staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50/50"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none truncate"
              >
                <option value="all">All Status</option>
                {taskStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label} ({status.count})
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="h-3 w-3 text-gray-400" />
              </div>
            </div>

            {(currentRole === 'partner' || currentRole === 'manager') && (
              <div className="relative">
                <select
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none truncate"
                >
                  <option value="all">All Staff</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Filter className="h-3 w-3 text-gray-400" />
                </div>
              </div>
            )}

            <div className="relative">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none truncate"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="h-3 w-3 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={filterComplianceType}
                onChange={(e) => setFilterComplianceType(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none truncate"
              >
                <option value="all">All Compliance</option>
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
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="h-3 w-3 text-gray-400" />
              </div>
            </div>
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
        <div className="space-y-4">
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 truncate max-w-[150px]">{task.client?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{task.staff?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${task.status === 'filed_completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                            task.status === 'ready_for_review' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              task.status === 'awaiting_client_data' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${new Date(task.due_date) < new Date() && task.status !== 'filed_completed' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Task List */}
          <div className="sm:hidden space-y-6">
            {taskStatuses.map(status => (
              groupedTasks[status.value]?.length > 0 && (
                <div key={status.value} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{status.label}</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {status.count}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {groupedTasks[status.value]?.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={onTaskUpdate}
                        onDelete={onTaskDelete}
                        currentRole={currentRole}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-500 shadow-sm">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No tasks found matching your filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterStaff('all');
                  setFilterPriority('all');
                  setFilterComplianceType('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                Clear all filters
              </button>
            </div>
          )}
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