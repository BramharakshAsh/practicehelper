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

// Custom storage handler to throttle writes
const throttledStorage = {
    getItem: (name: string) => {
        const str = localStorage.getItem(name);
        if (!str) return null;
        try {
            return JSON.parse(str);
        } catch (e) {
            console.error(`Error parsing persisted state for ${name}:`, e);
            localStorage.removeItem(name);
            return null;
        }
    },
    setItem: (name: string, value: any) => {
        // We only throttle the "tick" updates. 
        // If it's a start/stop action, we might want it immediate, 
        // but for simplicity and robustness against the 1s tick, we use a global throttle.
        const now = Date.now();
        const lastWrite = (window as any)[`last_write_${name}`] || 0;

        // If it's been more than 5 seconds since last write, or if the timer just stopped/started
        // (we can detect important changes if needed, but 5s is a good safe default)
        if (now - lastWrite > 5000) {
            localStorage.setItem(name, JSON.stringify(value));
            (window as any)[`last_write_${name}`] = now;
        }
    },
    removeItem: (name: string) => localStorage.removeItem(name),
};

export const useTimeEntriesStore = create<TimeEntriesState>()(
    persist(
        (set, get) => ({
            // ... (rest of the store implementation remains the same)
            activeTimer: {
                activeTaskId: null,
                startedAt: null,
                elapsedSeconds: 0,
                isRunning: false,
            },

            startTimer: (taskId) => {
                const { activeTimer } = get();
                if (activeTimer.activeTaskId && activeTimer.activeTaskId !== taskId) {
                    throw new Error('Timer already running for another task');
                }

                if (activeTimer.activeTaskId === taskId && activeTimer.startedAt) {
                    set({ activeTimer: { ...activeTimer, isRunning: true } });
                    // Force immediate save on start
                    (window as any)[`last_write_firm-flow-timer-storage`] = 0;
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
                // Force immediate save on start
                (window as any)[`last_write_firm-flow-timer-storage`] = 0;
            },

            stopTimer: async (notes) => {
                const { activeTimer, resetTimer } = get();
                if (!activeTimer.activeTaskId || !activeTimer.startedAt) return null;

                const endTime = new Date();
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
                    // Force immediate save on stop
                    (window as any)[`last_write_firm-flow-timer-storage`] = 0;
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
                // Force immediate save on pause
                (window as any)[`last_write_firm-flow-timer-storage`] = 0;
            },

            resumeTimer: () => {
                set(state => ({
                    activeTimer: { ...state.activeTimer, isRunning: true }
                }));
                // Force immediate save on resume
                (window as any)[`last_write_firm-flow-timer-storage`] = 0;
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
                // Force immediate save on reset
                (window as any)[`last_write_firm-flow-timer-storage`] = 0;
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
            storage: throttledStorage,
        }
    )
);
