import React, { useEffect, useState } from 'react';
import { useReportsStore } from '../store/reports.store';
import { BarChart3, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import RevenueChart from '../components/Reports/RevenueChart';
import TaskDistributionChart from '../components/Reports/TaskDistributionChart';
import StaffPerformanceChart from '../components/Reports/StaffPerformanceChart';

const ReportsPage: React.FC = () => {
    const { fetchAllMetrics, financials, tasks, staff, isLoading } = useReportsStore();
    const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

    useEffect(() => {
        const now = new Date();
        let startDate: Date | undefined;
        const endDate = now;

        switch (dateRange) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all':
                startDate = undefined;
                break;
        }

        fetchAllMetrics(startDate, endDate);
    }, [dateRange, fetchAllMetrics]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                    <p className="text-sm text-gray-600 mt-1">Practice performance overview</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    {(['month', 'quarter', 'year', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dateRange === range
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                } capitalize`}
                        >
                            {range === 'all' ? 'All Time' : `This ${range}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-50 text-green-600">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold text-green-600">₹{financials?.collectedRevenue.toLocaleString() || '0'}</span>
                    </div>
                    <h3 className="text-gray-600 font-medium">Collected Revenue</h3>
                    <p className="text-xs text-gray-400 mt-1">Total revenue collected in period</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold text-orange-600">₹{financials?.outstandingAmount.toLocaleString() || '0'}</span>
                    </div>
                    <h3 className="text-gray-600 font-medium">Outstanding</h3>
                    <p className="text-xs text-gray-400 mt-1">Total unpaid invoices</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold text-blue-600">{tasks?.completedTasks || 0}</span>
                    </div>
                    <h3 className="text-gray-600 font-medium">Tasks Completed</h3>
                    <p className="text-xs text-gray-400 mt-1">Tasks filed/completed</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold text-purple-600">
                            {staff?.reduce((acc, s) => acc + s.billableHours, 0).toFixed(1) || '0'}h
                        </span>
                    </div>
                    <h3 className="text-gray-600 font-medium">Billable Hours</h3>
                    <p className="text-xs text-gray-400 mt-1">Total time tracked as billable</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={financials?.revenueByMonth || []} />
                <TaskDistributionChart data={tasks?.byStatus || []} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6">
                <StaffPerformanceChart data={staff || []} />
            </div>
        </div>
    );
};

export default ReportsPage;
