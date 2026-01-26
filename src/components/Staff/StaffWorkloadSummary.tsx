import React, { useMemo } from 'react';
import { Staff, Task } from '../../types';
import { BarChart3, AlertCircle, Clock, CheckCircle2, FileText } from 'lucide-react';

interface StaffWorkloadSummaryProps {
    staff: Staff[];
    tasks: Task[];
}

const StaffWorkloadSummary: React.FC<StaffWorkloadSummaryProps> = ({ staff, tasks }) => {
    const summary = useMemo(() => {
        return staff.map(member => {
            const memberTasks = tasks.filter(t => t.staff_id === member.user_id);

            const totalTasks = memberTasks.length;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdueTasks = memberTasks.filter(t => {
                if (t.status === 'filed_completed') return false;
                const dueDate = new Date(t.due_date);
                return dueDate < today;
            }).length;

            const awaitingClientData = memberTasks.filter(t => t.status === 'awaiting_client_data').length;

            const pendingReview = memberTasks.filter(t => t.status === 'ready_for_review').length;

            return {
                ...member,
                stats: {
                    totalTasks,
                    overdueTasks,
                    awaitingClientData,
                    pendingReview
                }
            };
        });
    }, [staff, tasks]);

    if (staff.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8 hover:shadow-md transition-shadow duration-300">
            <div className="p-6 border-b border-gray-200 flex items-center bg-gray-50/50">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Staff Workload Summary</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Staff Member
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center justify-center space-x-1">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Total Tasks</span>
                                </div>
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-semibold text-red-600 uppercase tracking-wider">
                                <div className="flex items-center justify-center space-x-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>Overdue</span>
                                </div>
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-semibold text-orange-600 uppercase tracking-wider">
                                <div className="flex items-center justify-center space-x-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Awaiting Data</span>
                                </div>
                            </th>
                            <th className="text-center py-4 px-6 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                <div className="flex items-center justify-center space-x-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Pending Review</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {summary.map((member) => (
                            <tr key={member.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                                <td className="py-4 px-6">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-3 shadow-sm border border-blue-200">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{member.name}</div>
                                            <div className="text-xs text-gray-500 capitalize">{member.role.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        {member.stats.totalTasks}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${member.stats.overdueTasks > 0
                                            ? 'bg-red-50 text-red-700 border-red-100'
                                            : 'bg-gray-50 text-gray-400 border-transparent'
                                        }`}>
                                        {member.stats.overdueTasks}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${member.stats.awaitingClientData > 0
                                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                                            : 'bg-gray-50 text-gray-400 border-transparent'
                                        }`}>
                                        {member.stats.awaitingClientData}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${member.stats.pendingReview > 0
                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                            : 'bg-gray-50 text-gray-400 border-transparent'
                                        }`}>
                                        {member.stats.pendingReview}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffWorkloadSummary;
