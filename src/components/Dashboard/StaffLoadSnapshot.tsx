import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, Staff } from '../../types';
import { ArrowRight, User } from 'lucide-react';

interface StaffLoadSnapshotProps {
    tasks: Task[];
    staff: Staff[];
}

const StaffLoadSnapshot: React.FC<StaffLoadSnapshotProps> = ({ tasks, staff }) => {
    const navigate = useNavigate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate workload per staff
    const staffWorkload = staff.filter(s => s.role !== 'admin').map(member => {
        const memberTasks = tasks.filter(t => t.staff_id === member.id && t.status !== 'filed_completed');
        const dueTodayCount = memberTasks.filter(t => {
            const d = new Date(t.due_date);
            const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            return dateOnly.getTime() === today.getTime();
        }).length;

        // Check for overdue
        const overdueCount = memberTasks.filter(t => {
            const d = new Date(t.due_date);
            const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            return dateOnly.getTime() < today.getTime();
        }).length;

        return {
            ...member,
            activeCount: memberTasks.length,
            dueTodayCount,
            overdueCount
        };
    }).sort((a, b) => b.activeCount - a.activeCount).slice(0, 5); // Top 5 by load

    // Arbitrary capacity for visual bar (e.g., 10 tasks = 100%)
    const maxCapacity = 10;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Staff Workload Snapshot</h3>
                <button
                    onClick={() => navigate('/staff')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                    View All Staff
                    <ArrowRight className="h-4 w-4 ml-1" />
                </button>
            </div>

            <div className="space-y-5">
                {staffWorkload.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <User className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p>No active staff workload</p>
                    </div>
                ) : (
                    staffWorkload.map(member => {
                        const percentage = Math.min(100, (member.activeCount / maxCapacity) * 100);

                        return (
                            <div key={member.id} className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => navigate('/staff')}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-medium text-gray-900 text-sm">{member.name}</div>
                                    <div className="text-xs text-gray-500">
                                        <span className="font-bold text-gray-800">{member.activeCount} tasks</span>
                                        {member.dueTodayCount > 0 && <span className="text-blue-600 ml-1">({member.dueTodayCount} due today)</span>}
                                        {member.overdueCount > 0 && <span className="text-red-600 ml-1">({member.overdueCount} overdue)</span>}
                                    </div>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${member.activeCount > 8 ? 'bg-red-500' : member.activeCount > 5 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StaffLoadSnapshot;
