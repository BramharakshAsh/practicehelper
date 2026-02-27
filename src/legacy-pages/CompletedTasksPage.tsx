import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, RotateCcw, Calendar, User, Building, Clock, Receipt, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
// import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { Task } from '../types';

const CompletedTasksPage: React.FC = () => {
    const { archivedTasks, fetchArchivedUserTasks, isArchivedLoading, updateTask } = useTasks();
    // const { clients } = useClients(); // clients no longer needed for completed tasks lookup
    const { staff } = useStaff();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<'title' | 'updated_at' | 'billing_status'>('updated_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Local state for optimistic edits
    const [editingHours, setEditingHours] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchArchivedUserTasks();
    }, [fetchArchivedUserTasks]);

    // Filter only completed tasks - they are already filtered by the service, but we search and sort here
    const completedTasks = archivedTasks
        .filter(t => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const clientName = t.client?.name || '';
            const staffMember = staff.find(s => s.user_id === t.staff_id);
            return (
                t.title.toLowerCase().includes(term) ||
                clientName.toLowerCase().includes(term) ||
                staffMember?.name.toLowerCase().includes(term) ||
                (t.period || '').toLowerCase().includes(term)
            );
        })
        .sort((a, b) => {
            let cmp = 0;
            if (sortField === 'title') cmp = a.title.localeCompare(b.title);
            else if (sortField === 'updated_at') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            else if (sortField === 'billing_status') cmp = (a.billing_status || 'not_billed').localeCompare(b.billing_status || 'not_billed');
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const handleRestore = async (taskId: string) => {
        await updateTask(taskId, { status: 'ready_for_review' });
    };

    const handleHoursBlur = useCallback(async (taskId: string) => {
        const val = editingHours[taskId];
        if (val === undefined) return;
        const hours = parseFloat(val);
        if (!isNaN(hours) && hours >= 0) {
            await updateTask(taskId, { time_involved: hours });
        }
        setEditingHours(prev => {
            const next = { ...prev };
            delete next[taskId];
            return next;
        });
    }, [editingHours, updateTask]);

    const handleBillingToggle = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'billed' ? 'not_billed' : 'billed';
        await updateTask(taskId, { billing_status: newStatus as 'billed' | 'not_billed' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const SortIcon = ({ field }: { field: typeof sortField }) => {
        if (sortField !== field) return <ChevronDown className="h-3 w-3 text-gray-300 ml-1 inline" />;
        return sortDir === 'asc'
            ? <ChevronUp className="h-3 w-3 text-blue-600 ml-1 inline" />
            : <ChevronDown className="h-3 w-3 text-blue-600 ml-1 inline" />;
    };

    // Summary stats
    const totalTasks = completedTasks.length;
    const totalHours = completedTasks.reduce((sum, t) => sum + (t.time_involved || 0), 0);
    const billedCount = completedTasks.filter(t => t.billing_status === 'billed').length;
    const unbilledCount = totalTasks - billedCount;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Completed Tasks</h2>
                <p className="text-sm text-gray-600 mt-1">
                    View, track billing, and manage all completed tasks
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                            <p className="text-xs text-gray-500 font-medium">Total Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
                            <p className="text-xs text-gray-500 font-medium">Total Hours</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Receipt className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{billedCount}</p>
                            <p className="text-xs text-gray-500 font-medium">Billed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Receipt className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{unbilledCount}</p>
                            <p className="text-xs text-gray-500 font-medium">Not Billed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by task, client, staff, or period..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm"
                />
            </div>

            {isArchivedLoading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-gray-200">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading completed tasks...</p>
                </div>
            ) : completedTasks.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Tasks</h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'No tasks match your search' : 'Completed tasks will appear here'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        onClick={() => handleSort('title')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                    >
                                        Task <SortIcon field="title" />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Staff
                                    </th>
                                    <th
                                        onClick={() => handleSort('updated_at')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                    >
                                        Completed On <SortIcon field="updated_at" />
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center space-x-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>Time (hrs)</span>
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('billing_status')}
                                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                    >
                                        <div className="flex items-center justify-center space-x-1">
                                            <Receipt className="h-3.5 w-3.5" />
                                            <span>Billing <SortIcon field="billing_status" /></span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {completedTasks.map((task: Task) => {
                                    const clientName = task.client ? task.client.name : 'N/A';
                                    const staffMember = staff.find(s => s.user_id === task.staff_id);
                                    const billingStatus = task.billing_status || 'not_billed';
                                    const isBilled = billingStatus === 'billed';

                                    return (
                                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
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
                                                    <Building className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[140px]">{clientName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <User className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[120px]">{staffMember?.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(task.updated_at)}
                                            </td>

                                            {/* Time Involved */}
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={editingHours[task.id] !== undefined ? editingHours[task.id] : (task.time_involved ?? '')}
                                                    onChange={(e) => setEditingHours(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                    onBlur={() => handleHoursBlur(task.id)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleHoursBlur(task.id); }}
                                                    placeholder="0"
                                                    className="w-20 text-center text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                                                />
                                            </td>

                                            {/* Billing Status */}
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleBillingToggle(task.id, billingStatus)}
                                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 border ${isBilled
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                                        : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
                                                        }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isBilled ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                                    {isBilled ? 'Billed' : 'Not Billed'}
                                                </button>
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
                    <strong>Note:</strong> Click on the billing status badge to toggle between "Billed" and "Not Billed". Enter hours directly in the Time column. Changes save automatically.
                </p>
            </div>
        </div>
    );
};

export default CompletedTasksPage;
