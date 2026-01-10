import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, Staff, Client } from '../../types';
import { ArrowRight, AlertTriangle, Clock } from 'lucide-react';

interface UrgentTasksTableProps {
    tasks: Task[];
    clients: Client[];
    staff: Staff[];
}

const UrgentTasksTable: React.FC<UrgentTasksTableProps> = ({ tasks, clients, staff }) => {
    const navigate = useNavigate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Filter Tasks
    const urgentTasks = tasks.filter(task => {
        // Exclude completed
        if (task.status === 'filed_completed') return false;

        // Filter by due date: Overdue OR Due within next 7 days
        const dueDate = new Date(task.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        const diffTime = dueDateOnly.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Include if overdue OR due within next 7 days
        if (diffDays <= 7) return true;

        return false;
    }).sort((a, b) => {
        // Sort logic: 
        // 1. Overdue first (ascending due date)
        // 2. Then upcoming (ascending due date)
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    // Limit to 5 tasks
    const displayTasks = urgentTasks.slice(0, 5);

    const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
    };

    const getStaffName = (staffId?: string) => {
        return staff.find(s => s.user_id === staffId)?.name || 'Unassigned';
    };

    const getStatusBadge = (status: Task['status']) => {
        switch (status) {
            case 'assigned':
                return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Assigned</span>;
            case 'in_progress':
                return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">In Progress</span>;
            case 'awaiting_client_data':
                return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Client Waiting</span>;
            case 'ready_for_review':
                return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Review</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{status.replace('_', ' ')}</span>;
        }
    };

    const getDueDateDisplay = (dateStr: string) => {
        const d = new Date(dateStr);
        const dueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return <span className="text-red-600 font-medium">Overdue {Math.abs(diffDays)}d</span>;
        } else if (diffDays === 0) {
            return <span className="text-blue-600 font-bold">Due Today</span>;
        } else if (diffDays === 1) {
            return <span className="text-orange-600">Due Tomorrow</span>;
        } else {
            return <span className="text-gray-600">Due in {diffDays}d</span>;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Urgent & Overdue Tasks</h3>
                <button
                    onClick={() => navigate('/tasks')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                    View All Tasks
                    <ArrowRight className="h-4 w-4 ml-1" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pl-2">Client</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Task</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Assignee</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Status</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-2">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayTasks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                        <p>No urgent tasks due in the next 7 days</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayTasks.map(task => (
                                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 pl-2 max-w-[200px] truncate">
                                        <span className="text-sm font-medium text-gray-900">{getClientName(task.client_id)}</span>
                                    </td>
                                    <td className="py-3 text-sm text-blue-600 font-medium cursor-pointer" onClick={() => navigate('/tasks')}>
                                        {task.title}
                                    </td>
                                    <td className="py-3 text-sm text-gray-600">
                                        {getStaffName(task.staff_id)}
                                    </td>
                                    <td className="py-3">
                                        {getStatusBadge(task.status)}
                                    </td>
                                    <td className="py-3 text-right pr-2 text-sm">
                                        {getDueDateDisplay(task.due_date)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {urgentTasks.length > 5 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/tasks?sort=due_asc')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        {urgentTasks.length - 5} more urgent tasks...
                    </button>
                </div>
            )}
        </div>
    );
};
import { CheckCircle } from 'lucide-react';

export default UrgentTasksTable;
