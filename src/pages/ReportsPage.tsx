import * as React from 'react';
import { useTasks } from '../hooks/useTasks';
import { PieChart, CheckCircle2, BarChart3, AlertCircle, Clock } from 'lucide-react';

const ReportsPage: React.FC = () => {
    const { tasks } = useTasks();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'filed_completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'filed_completed').length;

    const stats = [
        { label: 'Total Tasks', value: totalTasks, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Completed', value: completedTasks, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Pending / In Progress', value: pendingTasks, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Overdue', value: overdueTasks, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                <p className="text-sm text-gray-600 mt-1">Practice performance overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">{stat.label}</h3>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <PieChart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Reports Coming Soon</h3>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Advanced analytics including revenue reports, staff utilization, and client aging reports are currently under development as part of the Phase 4 rollout.
                </p>
            </div>
        </div>
    );
};

export default ReportsPage;
