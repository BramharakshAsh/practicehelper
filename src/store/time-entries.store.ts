import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimeEntry } from '../types';
import { timeEntriesService, TimeEntryParams } from '../services/time-entries.service';

interface TimerState {
    activeTaskId: string | null;
    startedAt: string | null;
    elapsedSeconds: number;
    isRunning: boolean;
}

interface TimeEntriesState {
    // Active Timer (persisted)
    activeTimer: TimerState;

    // Actions
    startTimer: (taskId: string) => void;
    stopTimer: (notes?: string) => Promise<TimeEntry | null>;
    pauseTimer: () => void;
    resumeTimer: () => void;
    resetTimer: () => void;
    tick: () => void; // Called by interval

    // Data Actions
    logManualEntry: (params: TimeEntryParams) => Promise<TimeEntry>;
}

export const useTimeEntriesStore = create<TimeEntriesState>()(
    persist(
        (set, get) => ({
            activeTimer: {
                activeTaskId: null,
                startedAt: null,
                elapsedSeconds: 0,
                isRunning: false,
            },

            startTimer: (taskId) => {
                const { activeTimer } = get();
                if (activeTimer.activeTaskId && activeTimer.activeTaskId !== taskId) {
                    // Logic to stop previous timer could go here, or throw error
                    throw new Error('Timer already running for another task');
                }

                if (activeTimer.activeTaskId === taskId && activeTimer.startedAt) {
                    // Already running for this task, just resume if paused
                    set({ activeTimer: { ...activeTimer, isRunning: true } });
                    return;
                }

                set({
                    activeTimer: {
                        activeTaskId: taskId,
                        startedAt: new Date().toISOString(),
                        elapsedSeconds: 0,
                        isRunning: true,
                    }
                });
            },

            stopTimer: async (notes) => {
                const { activeTimer, resetTimer } = get();
                if (!activeTimer.activeTaskId || !activeTimer.startedAt) return null;

                const endTime = new Date();
                const startTime = new Date(activeTimer.startedAt);
                // Adjust duration based on elapsedSeconds which handles pauses implicitly if we implemented pause logic correctly.
                // For simplified MVP, we'll use elapsedSeconds for duration.
                const durationMinutes = Math.ceil(activeTimer.elapsedSeconds / 60);

                try {
                    const entry = await timeEntriesService.createTimeEntry({
                        taskId: activeTimer.activeTaskId,
                        startedAt: activeTimer.startedAt,
                        endedAt: endTime.toISOString(),
                        durationMinutes: durationMinutes,
                        entryType: 'timer',
                        notes: notes,
                        isBillable: true
                    });

                    resetTimer();
                    return entry;
                } catch (error) {
                    console.error('Failed to log time entry:', error);
                    throw error;
                }
            },

            pauseTimer: () => {
                set(state => ({
                    activeTimer: { ...state.activeTimer, isRunning: false }
                }));
            },

            resumeTimer: () => {
                set(state => ({
                    activeTimer: { ...state.activeTimer, isRunning: true }
                }));
            },

            resetTimer: () => {
                set({
                    activeTimer: {
                        activeTaskId: null,
                        startedAt: null,
                        elapsedSeconds: 0,
                        isRunning: false,
                    }
                });
            },

            tick: () => {
                const { activeTimer } = get();
                if (activeTimer.isRunning) {
                    set({
                        activeTimer: {
                            ...activeTimer,
                            elapsedSeconds: activeTimer.elapsedSeconds + 1
                        }
                    });
                }
            },

            logManualEntry: async (params) => {
                return await timeEntriesService.createTimeEntry(params);
            }
        }),
        {
            name: 'firm-flow-timer-storage',
        }
    )
);
