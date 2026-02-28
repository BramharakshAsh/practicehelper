import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { closureService } from '../../services/closure.service';
import { AlertCircle, CheckCircle, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';

interface ClosureModalProps {
    isOpen: boolean;
    onComplete: () => void;
    onlyUnreported?: boolean;
}

export const DailyClosureModal: React.FC<ClosureModalProps> = ({ isOpen, onComplete, onlyUnreported }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [initialTaskCount, setInitialTaskCount] = useState(0);

    const [remarks, setRemarks] = useState('');
    const [completionPercentage, setCompletionPercentage] = useState(0);

    useEffect(() => {
        if (isOpen) {
            loadTasks();
        }
    }, [isOpen, onlyUnreported]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const pendingTasks = await closureService.getTasksForClosure(onlyUnreported);
            setTasks(pendingTasks);
            setInitialTaskCount(pendingTasks.length);
            setRemarks('');
            if (pendingTasks.length > 0) {
                setCompletionPercentage(pendingTasks[0].completion_percentage || 0);
            }
            if (pendingTasks.length === 0) {
                onComplete();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
        );
    }

    if (tasks.length === 0) {
        onComplete();
        return null;
    }

    const currentTask = tasks[0];
    const completedCount = initialTaskCount - tasks.length + 1;

    const handleAction = async (action: 'no_change' | 'blocked' | 'waiting_client' | 'progress') => {
        if (!currentTask) return;
        setSubmittingId(currentTask.id);

        try {
            await closureService.submitClosure(currentTask, action, remarks, completionPercentage);

            const newTasks = [...tasks];
            newTasks.splice(0, 1); // remove the completed task
            setTasks(newTasks);
            setRemarks('');
            if (newTasks.length > 0) {
                setCompletionPercentage(newTasks[0].completion_percentage || 0);
            }

            if (newTasks.length === 0) {
                onComplete();
            }
        } catch (err) {
            console.error('Failed to submit closure', err);
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="bg-brand-primary p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <h2 className="text-2xl font-bold mb-2 relative z-10">
                        {onlyUnreported ? 'Report Unreported Tasks' : 'Daily Closure Required'}
                    </h2>
                    <p className="opacity-90 relative z-10">
                        {onlyUnreported
                            ? 'Please provide closure remarks for these tasks from yesterday.'
                            : 'You must update progress on your active tasks before closing the day.'}
                    </p>
                </div>

                <div className="p-6">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{currentTask.title}</h3>
                            {currentTask.client && (
                                <p className="text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]" title={currentTask.client.name}>
                                    Client: {currentTask.client.name}
                                </p>
                            )}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
                            {currentTask.priority || 'Medium'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quick Remarks (Optional)
                            </label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary bg-white shadow-sm"
                                placeholder="e.g. Sent GST documents, waiting for OTP..."
                                disabled={submittingId !== null}
                                autoFocus
                            />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-blue-900">
                                    Current Progress
                                </label>
                                <span className="text-xl font-black text-blue-700">{completionPercentage}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={completionPercentage}
                                onChange={(e) => setCompletionPercentage(parseInt(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                disabled={submittingId !== null}
                            />
                            <div className="flex justify-between text-xs text-blue-600/70 mt-1 font-medium px-1">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleAction('progress')}
                                disabled={submittingId !== null}
                                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-200 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                <CheckCircle className="h-6 w-6 mb-2" />
                                <span className="font-semibold text-sm">Made Progress</span>
                            </button>

                            <button
                                onClick={() => handleAction('no_change')}
                                disabled={submittingId !== null}
                                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                <ChevronRight className="h-6 w-6 mb-2" />
                                <span className="font-semibold text-sm">No Change</span>
                            </button>

                            <button
                                onClick={() => handleAction('waiting_client')}
                                disabled={submittingId !== null}
                                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                <MessageSquare className="h-6 w-6 mb-2" />
                                <span className="font-semibold text-sm text-center">Waiting on Client</span>
                            </button>

                            <button
                                onClick={() => handleAction('blocked')}
                                disabled={submittingId !== null}
                                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                <AlertCircle className="h-6 w-6 mb-2" />
                                <span className="font-semibold text-sm">Blocked</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-gray-500">
                    <span>Task {completedCount} of {initialTaskCount}</span>
                    <span>{tasks.length - 1} remaining</span>
                </div>
            </div>
        </div>
    );
};
