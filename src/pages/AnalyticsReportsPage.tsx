import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { analyticsService, DisciplineStats, AgingStats, OverloadStats, ClientDependencyStats } from '../services/analytics.service';
import {
    AlertTriangle,
    CalendarClock,
    Users,
    Activity,
    BarChart3,
    RefreshCcw,
    ShieldAlert,
    Clock,
    UserX
} from 'lucide-react';

const AnalyticsReportsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [disciplineStats, setDisciplineStats] = useState<DisciplineStats | null>(null);
    const [agingStats, setAgingStats] = useState<AgingStats | null>(null);
    const [overloadStats, setOverloadStats] = useState<OverloadStats[]>([]);
    const [dependencyStats, setDependencyStats] = useState<ClientDependencyStats[]>([]);

    const fetchData = async () => {
        if (!user?.firm_id) return;
        setLoading(true);
        try {
            const [discipline, aging, overload, dependency] = await Promise.all([
                analyticsService.getDisciplineStats(user.firm_id),
                analyticsService.getOverdueAging(user.firm_id),
                analyticsService.getOverloadSnapshot(user.firm_id),
                analyticsService.getClientDependencyStats(user.firm_id)
            ]);

            setDisciplineStats(discipline);
            setAgingStats(aging);
            setOverloadStats(overload);
            setDependencyStats(dependency);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.firm_id]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center">
                    <RefreshCcw className="h-8 w-8 text-brand-primary animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading Firm Analytics...</p>
                </div>
            </div>
        );
    }

    // Helper to calculate max tasks for the overload progress bars
    const maxOverloadTasks = Math.max(...overloadStats.map(s => s.taskCount), 1);

    return (
        <div className="flex flex-col space-y-6 pb-12 fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Activity className="h-6 w-6 mr-3 text-brand-primary" />
                        Practice Analytics
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Actionable short-term insights to unblock your team.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium border border-slate-200"
                >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh Data
                </button>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Discipline Report */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <UserX className="w-32 h-32" />
                    </div>
                    <div className="flex items-center mb-6 z-10">
                        <div className="p-2.5 bg-rose-50 rounded-xl mr-3 border border-rose-100">
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Discipline Report</h2>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-start mb-6 z-10">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-5xl font-black text-rose-600 tracking-tight">
                                {disciplineStats?.totalMissedDays || 0}
                            </span>
                        </div>
                        <p className="text-slate-600 font-medium mt-2 text-lg">
                            missed closure days <span className="text-slate-400 font-normal">in the last 30 days.</span>
                        </p>
                    </div>

                    <div className="mt-auto border-t border-slate-100 pt-5 z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Repeat Offenders</p>
                        {disciplineStats?.repeatOffenders && disciplineStats.repeatOffenders.length > 0 ? (
                            <ul className="space-y-2">
                                {disciplineStats.repeatOffenders.map((offender, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-700">{offender.staffName}</span>
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-bold">
                                            {offender.missedCount} missed
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Excellent! No repeat offenders.</p>
                        )}
                    </div>
                </div>

                {/* 2. Overdue & Aging Report */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CalendarClock className="w-32 h-32" />
                    </div>
                    <div className="flex items-center mb-6 z-10">
                        <div className="p-2.5 bg-orange-50 rounded-xl mr-3 border border-orange-100">
                            <CalendarClock className="h-5 w-5 text-orange-500" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Overdue & Aging</h2>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-3 z-10">
                        {/* 0-3 Days */}
                        <div className="flex flex-col items-center justify-center bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                            <span className="text-3xl font-black text-amber-500 mb-1">{agingStats?.bucket0to3 || 0}</span>
                            <span className="text-xs font-bold text-amber-700/70 uppercase text-center">0-3 Days<br />Delay</span>
                        </div>
                        {/* 4-7 Days */}
                        <div className="flex flex-col items-center justify-center bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-[inset_0_2px_10px_rgba(251,146,60,0.05)]">
                            <span className="text-3xl font-black text-orange-500 mb-1">{agingStats?.bucket4to7 || 0}</span>
                            <span className="text-xs font-bold text-orange-700/70 uppercase text-center">4-7 Days<br />Staging</span>
                        </div>
                        {/* 8+ Days */}
                        <div className="flex flex-col items-center justify-center bg-rose-50 border border-rose-300 rounded-xl p-4 relative shadow-[inset_0_2px_10px_rgba(225,29,72,0.05)] ring-1 ring-rose-500/20">
                            <span className="text-3xl font-black text-rose-600 mb-1">{agingStats?.bucket8Plus || 0}</span>
                            <span className="text-xs font-bold text-rose-700/80 uppercase text-center">8+ Days<br />Bleeding</span>
                            {(agingStats?.bucket8Plus || 0) > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 text-center z-10">
                        <p className="text-xs text-slate-500">Focus on the red metric. 8+ days means major unblocking needed.</p>
                    </div>
                </div>

                {/* 3. Overload Snapshot */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col lg:col-span-1">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className="p-2.5 bg-blue-50 rounded-xl mr-3 border border-blue-100">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Overload Snapshot</h2>
                        </div>
                        <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">Next 7 Days</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {overloadStats.length > 0 ? (
                            <div className="space-y-5">
                                {overloadStats.map((staff, idx) => {
                                    const percentage = Math.min((staff.taskCount / maxOverloadTasks) * 100, 100);
                                    // Make the bar color turn orange/red if they have a disproportionate amount of tasks (e.g., > 15 in a week)
                                    const isOverloaded = staff.taskCount >= 15;
                                    const barColor = isOverloaded ? 'bg-gradient-to-r from-orange-400 to-rose-500' : 'bg-gradient-to-r from-blue-400 to-brand-primary';

                                    return (
                                        <div key={idx} className="relative">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-semibold text-slate-700">{staff.staffName}</span>
                                                <span className={`font-bold ${isOverloaded ? 'text-rose-600' : 'text-slate-600'}`}>
                                                    {staff.taskCount} tasks
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            {isOverloaded && (
                                                <p className="text-[10px] text-rose-500 mt-1 font-medium flex items-center">
                                                    <AlertTriangle className="h-3 w-3 mr-1" /> Approaching Overload Limit
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                                <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
                                <p className="text-sm">No tasks due in the next 7 days.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Client Dependency Report */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col lg:col-span-1">
                    <div className="flex items-center mb-6">
                        <div className="p-2.5 bg-emerald-50 rounded-xl mr-3 border border-emerald-100">
                            <Clock className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Client Bottlenecks</h2>
                            <p className="text-xs text-slate-500">Clients currently blocking work (`Awaiting Client Data`)</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {dependencyStats.length > 0 ? (
                            <table className="min-w-full divide-y divide-slate-100 text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Client Name</th>
                                        <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Tasks Blocked</th>
                                        <th className="px-3 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Days Stuck</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dependencyStats.map((stat, idx) => (
                                        <tr key={idx} className={`transition-colors hover:bg-slate-50 ${stat.hasCriticalTask ? 'bg-rose-50/30' : ''}`}>
                                            <td className="px-3 py-3 whitespace-nowrap text-slate-800 font-medium">
                                                {stat.clientName}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center text-slate-600 font-semibold">
                                                {stat.tasksBlocked}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${stat.avgDaysStuck > 5
                                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {stat.avgDaysStuck} days
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-emerald-500/70 py-8">
                                <Activity className="h-10 w-10 mb-2 opacity-70" />
                                <p className="text-sm font-medium">Everything is flowing. No clients are blocking work.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsReportsPage;
