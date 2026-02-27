import React from 'react';
import { Task } from '../../types';
import { Activity, AlertTriangle, MessageSquare, ShieldAlert, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PartnerMorningFeedProps {
    tasks: Task[];
}

const PartnerMorningFeed: React.FC<PartnerMorningFeedProps> = ({ tasks }) => {
    const navigate = useNavigate();

    const activeTasks = tasks.filter(t => t.status !== 'filed_completed');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueCount = activeTasks.filter(t => {
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() < today.getTime();
    }).length;

    const unreportedCount = activeTasks.filter(t => t.is_unreported).length;
    const dependenciesCount = activeTasks.filter(t => t.status === 'awaiting_client_data').length;

    // High Risk: Clients accounting for the highest proportion of overdue tasks
    const clientOverdueMap: Record<string, number> = {};
    activeTasks.forEach(t => {
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() < today.getTime()) {
            clientOverdueMap[t.client_id] = (clientOverdueMap[t.client_id] || 0) + 1;
        }
    });

    // Clients with 3 or more overdue tasks are considered high-risk
    const highRiskClientsCount = Object.values(clientOverdueMap).filter(count => count >= 3).length;

    return (
        <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldAlert className="w-48 h-48" />
            </div>

            <div className="p-8 relative z-10 border-b border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        Firm Control Summary
                    </h2>
                    <p className="text-slate-400 mt-2 max-w-lg">
                        Manage by exception. Here are the critical bottlenecks affecting your firm's performance today.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800 relative z-10">
                <div
                    onClick={() => navigate('/dashboard/tasks')}
                    className="bg-slate-900 p-6 hover:bg-slate-800/80 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-bold text-white group-hover:text-red-400 transition-colors">{overdueCount}</div>
                    </div>
                    <div className="font-semibold text-slate-300">Overdue tasks</div>
                    <div className="text-xs text-slate-500 mt-1">Requires immediate escalation</div>
                </div>

                <div
                    onClick={() => navigate('/dashboard/tasks')}
                    className="bg-slate-900 p-6 hover:bg-slate-800/80 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-bold text-white group-hover:text-orange-400 transition-colors">{unreportedCount}</div>
                    </div>
                    <div className="font-semibold text-slate-300">Unreported tasks</div>
                    <div className="text-xs text-slate-500 mt-1">Staff failed to provide closure</div>
                </div>

                <div
                    onClick={() => navigate('/dashboard/clients')}
                    className="bg-slate-900 p-6 hover:bg-slate-800/80 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors">{dependenciesCount}</div>
                    </div>
                    <div className="font-semibold text-slate-300">Client dependencies</div>
                    <div className="text-xs text-slate-500 mt-1">Stalled waiting for documents</div>
                </div>

                <div
                    onClick={() => navigate('/dashboard/clients')}
                    className="bg-slate-900 p-6 hover:bg-slate-800/80 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{highRiskClientsCount}</div>
                    </div>
                    <div className="font-semibold text-slate-300">High-risk clients</div>
                    <div className="text-xs text-slate-500 mt-1">Clients with 3+ overdue tasks</div>
                </div>
            </div>

        </div>
    );
};

export default PartnerMorningFeed;
