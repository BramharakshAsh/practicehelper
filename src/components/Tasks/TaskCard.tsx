import * as React from 'react';
const { useState } = React;
import { MoreVertical, User, Building, Calendar, MessageSquare, CheckCircle, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import { Task } from '../../types';
import TaskDetailsModal from './TaskDetailsModal';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  currentRole: 'partner' | 'staff';
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete, currentRole }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [remarks, setRemarks] = useState(task.remarks || '');

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    onUpdate(task.id, { status: newStatus, updated_at: new Date().toISOString() });
    setShowMenu(false);
  };

  const handleRemarksSubmit = () => {
    onUpdate(task.id, { remarks, updated_at: new Date().toISOString() });
    setShowRemarks(false);
  };

  const getNextStatuses = (currentStatus: Task['status']) => {
    switch (currentStatus) {
      case 'assigned':
        return ['in_progress'];
      case 'in_progress':
        return ['awaiting_client_data', 'ready_for_review', 'filed_completed'];
      case 'awaiting_client_data':
        return ['in_progress'];
      case 'ready_for_review':
        return currentRole === 'partner' ? ['in_progress', 'filed_completed'] : [];
      case 'filed_completed':
        return [];
      default:
        return [];
    }
  };

  const nextStatuses = getNextStatuses(task.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority} priority
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="py-2">
                <button
                  onClick={() => { setShowDetails(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as Task['status'])}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Move to {status.replace('_', ' ')}
                  </button>
                ))}
                <button
                  onClick={() => setShowRemarks(true)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Add/Edit Remarks
                </button>
                {currentRole === 'partner' && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this task?')) {
                        onDelete(task.id);
                        setShowMenu(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Building className="h-3 w-3" />
          <span>{task.client?.name}</span>
        </div>

        {currentRole === 'partner' && (
          <div className="flex items-center space-x-2">
            <User className="h-3 w-3" />
            <span>{task.staff?.name}</span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3" />
          <span>{task.period}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-600'
            }`}>
            Due: {formatDate(task.due_date)}
            {isOverdue(task.due_date) && ' (Overdue)'}
          </span>

          {task.status === 'awaiting_client_data' && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}

          {task.status === 'filed_completed' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {task.remarks && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
          <div className="flex items-center space-x-1 mb-1">
            <MessageSquare className="h-3 w-3" />
            <span className="font-medium">Remarks:</span>
          </div>
          <p>{task.remarks}</p>
        </div>
      )}

      {/* Remarks Modal */}
      {showRemarks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add/Edit Remarks</h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your remarks..."
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleRemarksSubmit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowRemarks(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <TaskDetailsModal
          task={task}
          onClose={() => setShowDetails(false)}
          onStatusChange={(taskId, status) => onUpdate(taskId, { status })}
        />
      )}
    </div>
  );
};

export default TaskCard;