import React, { useState } from 'react';
import { User, CheckCircle, Calendar, X, Trash2 } from 'lucide-react';
import { Task, Staff, UserRole } from '../../types';

interface TaskBulkActionsProps {
    selectedTasks: Task[];
    staff: Staff[];
    onClearSelection: () => void;
    onBulkUpdate: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
    onBulkDelete: (taskIds: string[]) => Promise<void>;
    currentRole?: UserRole;
}

const TaskBulkActions: React.FC<TaskBulkActionsProps> = ({
    selectedTasks,
    staff,
    onClearSelection,
    onBulkUpdate,
    onBulkDelete,
    currentRole,
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [newDueDate, setNewDueDate] = useState('');

    const taskIds = selectedTasks.map(t => t.id);

    const handleUpdate = async (updates: Partial<Task>) => {
        setIsUpdating(true);
        try {
            await onBulkUpdate(taskIds, updates);
            onClearSelection();
        } catch (error) {
            console.error('Bulk update failed:', error);
        } finally {
            setIsUpdating(false);
            setShowStatusMenu(false);
            setShowAssignMenu(false);
            setShowDateMenu(false);
        }
    };

    if (selectedTasks.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-2 flex items-center space-x-2 border border-blue-500/30 backdrop-blur-md bg-opacity-95">
                <div className="flex items-center space-x-3 px-4 py-2 border-r border-gray-700">
                    <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {selectedTasks.length}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">Tasks Selected</span>
                </div>

                <div className="flex items-center p-1 space-x-1">
                    {/* Status Update */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowStatusMenu(!showStatusMenu); setShowAssignMenu(false); setShowDateMenu(false); }}
                            className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors text-sm"
                            disabled={isUpdating}
                        >
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span>Status</span>
                        </button>
                        {showStatusMenu && (
                            <div className="absolute bottom-full mb-3 left-0 bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-1 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {['assigned', 'in_progress', 'awaiting_client_data', 'ready_for_review', ...(!['staff', 'paid_staff', 'articles'].includes(currentRole || '') ? ['filed_completed'] : [])].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdate({ status: status as Task['status'] })}
                                        className="w-full text-left px-3 py-2 hover:bg-blue-600 rounded-lg text-xs capitalize transition-colors"
                                    >
                                        {status.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Re-assignment */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowAssignMenu(!showAssignMenu); setShowStatusMenu(false); setShowDateMenu(false); }}
                            className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors text-sm"
                            disabled={isUpdating}
                        >
                            <User className="h-4 w-4 text-blue-400" />
                            <span>Assign</span>
                        </button>
                        {showAssignMenu && (
                            <div className="absolute bottom-full mb-3 left-0 bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-1 w-56 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-700 mb-1">Select Staff</p>
                                {staff.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleUpdate({ staff_id: s.user_id })}
                                        className="w-full text-left px-3 py-2 hover:bg-blue-600 rounded-lg text-xs flex items-center space-x-2 transition-colors"
                                    >
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span>{s.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Due Date Extension */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowDateMenu(!showDateMenu); setShowStatusMenu(false); setShowAssignMenu(false); }}
                            className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors text-sm"
                            disabled={isUpdating}
                        >
                            <Calendar className="h-4 w-4 text-orange-400" />
                            <span>Ext. Date</span>
                        </button>
                        {showDateMenu && (
                            <div className="absolute bottom-full mb-3 left-0 bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4 w-64 animate-in fade-in zoom-in-95 duration-200">
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Select New Due Date</label>
                                <div className="flex flex-col space-y-3">
                                    <input
                                        type="date"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => handleUpdate({ due_date: newDueDate })}
                                        disabled={!newDueDate}
                                        className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                    >
                                        Apply New Date
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delete Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center space-x-2 hover:bg-red-600/20 px-3 py-2 rounded-xl transition-colors text-sm"
                            disabled={isUpdating}
                        >
                            <Trash2 className="h-4 w-4 text-red-400" />
                            <span>Delete</span>
                        </button>
                        {showDeleteConfirm && (
                            <div className="absolute bottom-full mb-3 right-0 bg-gray-800 rounded-xl shadow-xl border border-red-500/50 p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
                                <h4 className="text-sm font-bold text-white mb-2">Confirm Deletion</h4>
                                <p className="text-xs text-gray-300 mb-4">
                                    Are you sure you want to delete {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''}? This action cannot be undone.
                                </p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={async () => {
                                            setIsUpdating(true);
                                            try {
                                                await onBulkDelete(taskIds);
                                                onClearSelection();
                                            } catch (error) {
                                                console.error('Bulk delete failed:', error);
                                            } finally {
                                                setIsUpdating(false);
                                                setShowDeleteConfirm(false);
                                            }
                                        }}
                                        disabled={isUpdating}
                                        className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                    >
                                        {isUpdating ? 'Deleting...' : 'Delete'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-1 border-l border-gray-700">
                    <button
                        onClick={onClearSelection}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors group"
                        title="Clear Selection"
                    >
                        <X className="h-5 w-5 text-gray-400 group-hover:text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskBulkActions;
