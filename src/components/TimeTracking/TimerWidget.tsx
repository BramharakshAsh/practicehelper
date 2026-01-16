import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useTimeEntriesStore } from '../../store/time-entries.store';
import { useTasksStore } from '../../store/tasks.store';

const TimerWidget: React.FC = () => {
    const { activeTimer, stopTimer, pauseTimer, resumeTimer, tick } = useTimeEntriesStore();
    const { getTask } = useTasksStore();
    const [taskTitle, setTaskTitle] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTimer.isRunning) {
            interval = setInterval(() => {
                tick();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer.isRunning, tick]);

    useEffect(() => {
        if (activeTimer.activeTaskId) {
            const task = getTask(activeTimer.activeTaskId);
            setTaskTitle(task?.title || 'Unknown Task');
        }
    }, [activeTimer.activeTaskId, getTask]);

    if (!activeTimer.activeTaskId) return null;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStop = async () => {
        if (window.confirm('Stop timer and log this entry?')) {
            const notes = window.prompt('Any notes for this session?');
            await stopTimer(notes || undefined);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-blue-100 shadow-lg rounded-xl p-4 flex items-center space-x-4 animate-fade-in-up z-50 w-80">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Active Timer</p>
                <p className="text-sm font-bold text-gray-900 truncate" title={taskTitle}>
                    {taskTitle}
                </p>
                <p className="text-xl font-mono text-gray-700 mt-1">{formatTime(activeTimer.elapsedSeconds)}</p>
            </div>
            <div className="flex flex-col space-y-2">
                {activeTimer.isRunning ? (
                    <button
                        onClick={pauseTimer}
                        className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                        title="Pause"
                    >
                        <Pause className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        onClick={resumeTimer}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="Resume"
                    >
                        <Play className="h-4 w-4" />
                    </button>
                )}
                <button
                    onClick={handleStop}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Stop"
                >
                    <Square className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default TimerWidget;
