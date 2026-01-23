import React from 'react';
import { CheckCircle, RotateCcw, Calendar, User, Building } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { Task } from '../types';

const CompletedTasksPage: React.FC = () => {
    const { tasks, updateTask } = useTasks();
    const { clients } = useClients();
    const { staff } = useStaff();

    // Filter only completed tasks
    const completedTasks = tasks.filter(t => t.status === 'filed_completed');

    const handleRestore = async (taskId: string) => {
        await updateTask(taskId, { status: 'ready_for_review' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Completed Tasks</h2>
                <p className="text-sm text-gray-600 mt-1">
                    View and manage all completed tasks
                </p>
            </div>

            {completedTasks.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Tasks</h3>
                    <p className="text-gray-600">
                        Completed tasks will appear here
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Task
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Staff
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Completed On
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {completedTasks.map((task: Task) => {
                                    const client = clients.find(c => c.id === task.client_id);
                                    const staffMember = staff.find(s => s.user_id === task.staff_id);

                                    return (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {task.title}
                                                    </div>
                                                    {task.period && (
                                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {task.period}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                                                    {client?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                                    {staffMember?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(task.updated_at)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRestore(task.id)}
                                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-900 text-sm font-medium"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                    <span>Restore</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Completed tasks are shown here for reference. You can restore a task to "Ready for Review" status if needed.
                </p>
            </div>
        </div>
    );
};

export default CompletedTasksPage;
