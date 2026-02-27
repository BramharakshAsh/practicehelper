import React from 'react';
import { Task } from '../../types';
import { AlertTriangle, Clock, MessageSquare, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StaffHealthMeter from './StaffHealthMeter';
import { useTasksStore } from '../../store/tasks.store';

interface StaffMorningFeedProps {
    tasks: Task[];
}

const StaffMorningFeed: React.FC<StaffMorningFeedProps> = ({ tasks }) => {
    const navigate = useNavigate();
    const { setManualClosureOpen } = useTasksStore();

    // Calculate metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeTasks = tasks.filter(t => t.status !== 'filed_completed');

    const dueTodayCount = activeTasks.filter(t => {
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
    }).length;

    const overdueCount = activeTasks.filter(t => {
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() < today.getTime();
    }).length;

    const unreportedCount = activeTasks.filter(t => t.is_unreported).length;

    const waitingClientCount = activeTasks.filter(t => t.status === 'awaiting_client_data').length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column: Flow Context */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 bg-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Clock className="w-32 h-32" />
                    </div>
                    <h2 className="text-xl font-bold gap-2 flex items-center text-gray-900 relative z-10">
                        <span className="text-2xl">⚡</span> Today's Execution Plan
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 relative z-10">
                        Clear your actionable items to maintain control.
                    </p>
                </div>

                <div className="p-6 space-y-4 flex-grow flex flex-col justify-center">
                    {dueTodayCount > 0 && (
                        <div
                            onClick={() => navigate('/dashboard/tasks')}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-100 transition-colors cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-200">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-orange-900">{dueTodayCount} tasks due today</h3>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        </div>
                    )}

                    {waitingClientCount > 0 && (
                        <div
                            onClick={() => navigate('/dashboard/tasks')}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-100 transition-colors cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 group-hover:bg-yellow-200">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-yellow-900">{waitingClientCount} tasks waiting on client documents</h3>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        </div>
                    )}

                    {overdueCount > 0 && (
                        <div
                            onClick={() => navigate('/dashboard/tasks')}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 transition-colors cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-200">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-red-900">{overdueCount} overdue tasks</h3>
                                <p className="text-sm text-red-700 font-medium">Clear these immediately</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                    )}

                    {unreportedCount > 0 && (
                        <div
                            onClick={() => navigate('/dashboard/tasks')}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-300">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{unreportedCount} unreported from yesterday</h3>
                                <p className="text-sm text-slate-600 font-medium my-1">Update status to close loop</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setManualClosureOpen(true);
                                    }}
                                    className="mt-2 flex items-center gap-2 text-xs font-semibold bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-transform active:scale-95 shadow-sm"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Report Now
                                </button>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                        </div>
                    )}

                    {activeTasks.length === 0 && (
                        <div className="text-center py-8 my-auto">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">🌱</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">All clear!</h3>
                            <p className="text-gray-500">You have no pending tasks right now.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Staff Health Meter */}
            <div className="lg:col-span-1 h-full max-h-[460px]">
                <StaffHealthMeter tasks={tasks} />
            </div>
        </div>
    );
};

export default StaffMorningFeed;
