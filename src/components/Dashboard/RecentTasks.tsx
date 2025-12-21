import React from 'react';
import { Clock, User, Building, AlertTriangle, CheckCircle, PlayCircle } from 'lucide-react';
import { Task } from '../../types';

interface RecentTasksProps {
  tasks: Task[];
  title: string;
}

const RecentTasks: React.FC<RecentTasksProps> = ({ tasks, title }) => {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'assigned':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'awaiting_client_data':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'ready_for_review':
        return <Clock className="h-4 w-4 text-purple-500" />;
      case 'filed_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_client_data':
        return 'bg-orange-100 text-orange-800';
      case 'ready_for_review':
        return 'bg-purple-100 text-purple-800';
      case 'filed_completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 border-l-4 ${getPriorityColor(task.priority)} bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(task.status)}
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{task.client?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{task.staff?.name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{task.period}</span>
                  <span className={`text-sm font-medium ${
                    isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    Due: {formatDate(task.due_date)}
                    {isOverdue(task.due_date) && ' (Overdue)'}
                  </span>
                </div>

                {task.remarks && (
                  <p className="text-sm text-gray-700 mt-2 italic">"{task.remarks}"</p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTasks;