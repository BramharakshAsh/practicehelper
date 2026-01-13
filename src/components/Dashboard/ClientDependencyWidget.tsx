import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, Client } from '../../types';
import { AlertTriangle, ChevronRight, User } from 'lucide-react';

interface ClientDependencyWidgetProps {
    tasks: Task[];
    clients: Client[];
}

const ClientDependencyWidget: React.FC<ClientDependencyWidgetProps> = ({ tasks, clients }) => {
    const navigate = useNavigate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Helper to calculate days pending
    const getDaysPending = (dateStr: string) => {
        const d = new Date(dateStr);
        const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffTime = today.getTime() - dateOnly.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    };

    // Filter and process tasks
    const blockedTasks = tasks
        .filter(t => t.status === 'awaiting_client_data')
        .map(t => ({
            ...t,
            daysPending: getDaysPending(t.updated_at || t.created_at)
        }))
        .sort((a, b) => b.daysPending - a.daysPending)
        .slice(0, 5);

    const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Dependencies</h3>
                <button
                    onClick={() => navigate('/dashboard/tasks?status=awaiting_client_data')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    View All
                </button>
            </div>

            <div className="space-y-4">
                {blockedTasks.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <User className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p>No work blocked by clients</p>
                    </div>
                ) : (
                    blockedTasks.map(task => (
                        <div key={task.id} className="flex items-start justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                            <div>
                                <div className="font-medium text-gray-900">{getClientName(task.client_id)}</div>
                                <div className="text-sm text-gray-600 mt-1">{task.title}</div>
                            </div>
                            <div className="flex items-center text-orange-700 font-medium whitespace-nowrap ml-4">
                                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                                <span>{task.daysPending} days</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {blockedTasks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={() => navigate('/dashboard/tasks?status=awaiting_client_data')}
                        className="text-xs text-gray-500 flex items-center hover:text-gray-900"
                    >
                        See all blocking items <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClientDependencyWidget;
