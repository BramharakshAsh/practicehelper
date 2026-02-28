import React, { useState, useEffect } from 'react';
import { closureReportService, DailyClosureReportDay, StaffClosureSummary, TaskClosure } from '../services/closure-report.service';
import { Loader2, Calendar, User, Search, CheckCircle2, XCircle, AlertCircle, Clock, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

const ReportsPage: React.FC = () => {
    const [reportDays, setReportDays] = useState<DailyClosureReportDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await closureReportService.getClosureReports(14); // Fetch last 14 days
                setReportDays(data);
                if (data.length > 0) {
                    setSelectedDayId(data[0].dateStr);
                }
            } catch (error) {
                console.error('Failed to fetch closure reports:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    const selectedDay = reportDays.find(d => d.dateStr === selectedDayId);

    // Sort staff: Reported first, then unreported, alphabetical within groups
    const sortedStaff = selectedDay ? Object.values(selectedDay.staffReports).sort((a, b) => {
        if (a.isReported && !b.isReported) return -1;
        if (!a.isReported && b.isReported) return 1;
        return a.staff_name.localeCompare(b.staff_name);
    }) : [];

    const selectedStaff = selectedDay && selectedStaffId ? selectedDay.staffReports[selectedStaffId] : null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
            </div>
        );
    }

    const renderActionBadge = (action: string) => {
        switch (action) {
            case 'progress':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Progress</span>;
            case 'blocked':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Blocked</span>;
            case 'waiting_client':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Waiting</span>;
            case 'no_change':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" /> No Change</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{action}</span>;
        }
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Left Sidebar: Days */}
            <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-brand-primary" />
                        Daily Closures
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {reportDays.map(day => {
                        const dateObj = new Date(day.dateStr);
                        const isSelected = selectedDayId === day.dateStr;
                        const reportedCount = Object.values(day.staffReports).filter(s => s.isReported).length;
                        const totalStaff = Object.values(day.staffReports).length;

                        return (
                            <button
                                key={day.dateStr}
                                onClick={() => {
                                    setSelectedDayId(day.dateStr);
                                    setSelectedStaffId(null);
                                }}
                                className={`w-full text-left px-3 py-3 rounded-lg flex items-center justify-between transition-colors ${isSelected ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'hover:bg-gray-100 text-gray-700 border border-transparent'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold text-sm">
                                        {format(dateObj, 'MMM d, yyyy')}
                                    </div>
                                    <div className="text-xs mt-0.5 opacity-80">
                                        {format(dateObj, 'EEEE')}
                                    </div>
                                </div>
                                <div className={`text-xs font-medium px-2 py-1 rounded-full ${reportedCount === totalStaff && totalStaff > 0 ? 'bg-green-100 text-green-700' :
                                        reportedCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {reportedCount}/{totalStaff}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Middle Column: Staff List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <User className="w-5 h-5 mr-2 text-gray-500" />
                        Staff Reports
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {selectedDay ? format(new Date(selectedDay.dateStr), 'MMMM d, yyyy') : 'Select a date'}
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-gray-50/30">
                    {sortedStaff.map(staff => {
                        const isSelected = selectedStaffId === staff.staff_id;
                        return (
                            <button
                                key={staff.staff_id}
                                onClick={() => setSelectedStaffId(isSelected ? null : staff.staff_id)}
                                className={`w-full text-left p-3 rounded-lg flex items-start justify-between transition-all ${isSelected ? 'bg-white shadow-sm border border-brand-primary/30 ring-1 ring-brand-primary/20' : 'hover:bg-gray-100 border border-transparent'
                                    }`}
                            >
                                <div>
                                    <div className={`font-medium text-sm ${isSelected ? 'text-brand-primary' : 'text-gray-900'}`}>
                                        {staff.staff_name}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize mt-0.5">
                                        {staff.role.replace('_', ' ')}
                                    </div>
                                </div>
                                <div>
                                    {staff.isReported ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Reported
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                                            <XCircle className="w-3 h-3 mr-1" /> Unreported
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                    {sortedStaff.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">No staff available for this day.</div>
                    )}
                </div>
            </div>

            {/* Right Column: Detail View */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {selectedStaff ? (
                    selectedStaff.isReported ? (
                        <>
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">{selectedStaff.staff_name}'s Report</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Submitted {selectedStaff.closures.length} task updates on {selectedDay ? format(new Date(selectedDay.dateStr), 'MMMM d, yyyy') : ''}
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {selectedStaff.closures.map(closure => (
                                        <div key={closure.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="text-base font-bold text-gray-900 flex items-center">
                                                        <CheckSquare className="w-4 h-4 mr-2 text-brand-primary" />
                                                        {closure.task?.title || 'Unknown Task'}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-1 font-medium">
                                                        Client: {closure.task?.client?.name || 'No Client'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {renderActionBadge(closure.action_type)}
                                                    <span className="text-xs text-gray-400">
                                                        {format(new Date(closure.created_at), 'h:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Progress Update</h5>
                                                        <div className="flex items-center gap-3">
                                                            {closure.action_type === 'progress' || closure.old_completion_percentage !== closure.new_completion_percentage ? (
                                                                <>
                                                                    <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden shrink-0">
                                                                        <div className="bg-slate-300 h-full rounded-full" style={{ width: `${closure.old_completion_percentage || 0}%` }}></div>
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-500 w-8">{closure.old_completion_percentage}%</span>
                                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                                    <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden shrink-0">
                                                                        <div className="bg-brand-primary h-full rounded-full transition-all duration-1000" style={{ width: `${closure.new_completion_percentage || 0}%` }}></div>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-brand-primary w-8">{closure.new_completion_percentage}%</span>
                                                                </>
                                                            ) : (
                                                                <div className="text-sm text-gray-600 flex items-center">
                                                                    <div className="w-24 bg-gray-100 h-2.5 rounded-full overflow-hidden shrink-0 mr-3">
                                                                        <div className="bg-slate-400 h-full rounded-full" style={{ width: `${closure.new_completion_percentage || 0}%` }}></div>
                                                                    </div>
                                                                    <span className="font-medium">{closure.new_completion_percentage}%</span> <span className="text-gray-400 ml-1">(Unchanged)</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status Change</h5>
                                                        {closure.old_status !== closure.new_status ? (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize">{closure.old_status?.replace(/_/g, ' ')}</span>
                                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                                                <span className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-medium rounded capitalize">{closure.new_status?.replace(/_/g, ' ')}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-600">
                                                                <span className="capitalize">{closure.new_status?.replace(/_/g, ' ')}</span> <span className="text-gray-400 text-xs ml-1">(Unchanged)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {(closure.remarks || closure.action_type === 'no_change') && (
                                                    <div className="mt-5 pt-4 border-t border-gray-100">
                                                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Remarks</h5>
                                                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic border border-gray-100">
                                                            "{closure.remarks || 'No significant change.'}"
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <XCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Report Submitted</h3>
                            <p className="text-gray-500 max-w-sm">
                                {selectedStaff.staff_name} did not submit a daily closure report for {selectedDay ? format(new Date(selectedDay.dateStr), 'MMMM d, yyyy') : 'this day'}.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50">
                        <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Staff Selected</h3>
                        <p className="text-gray-500 max-w-sm">
                            Select a staff member from the middle column to view their daily closure report details for the selected day.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component since I used ChevronRight but didn't import it at the top to save space
const ChevronRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export default ReportsPage;
