import { create } from 'zustand';
import { Meeting } from '../types';
import { meetingsService } from '../services/meetings.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface MeetingsState {
    meetings: Meeting[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchMeetings: (startDate?: Date, endDate?: Date) => Promise<void>;
    createMeeting: (meeting: Omit<Meeting, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;
    clearError: () => void;
}

export const useMeetingsStore = create<MeetingsState>((set) => ({
    meetings: [],
    isLoading: false,
    error: null,

    fetchMeetings: async (startDate, endDate) => {
        set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
            const meetings = await meetingsService.getMeetings(startDate, endDate);
            set({ meetings, isLoading: false });
        }, 'Fetch meetings').catch((error) => {
            set({
                error: ErrorService.getErrorMessage(error),
                isLoading: false
            });
        });
    },

    createMeeting: async (meetingData) => {
        set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
            const newMeeting = await meetingsService.createMeeting(meetingData);
            set(state => ({
                meetings: [newMeeting, ...state.meetings],
                isLoading: false
            }));
        }, 'Create meeting').catch((error) => {
            set({
                error: ErrorService.getErrorMessage(error),
                isLoading: false
            });
            throw error;
        });
    },

    updateMeeting: async (id, updates) => {
        set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
            const updatedMeeting = await meetingsService.updateMeeting(id, updates);
            set(state => ({
                meetings: state.meetings.map(meeting =>
                    meeting.id === id ? updatedMeeting : meeting
                ),
                isLoading: false
            }));
        }, 'Update meeting').catch((error) => {
            set({
                error: ErrorService.getErrorMessage(error),
                isLoading: false
            });
            throw error;
        });
    },

    deleteMeeting: async (id) => {
        set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
            await meetingsService.deleteMeeting(id);
            set(state => ({
                meetings: state.meetings.filter(meeting => meeting.id !== id),
                isLoading: false
            }));
        }, 'Delete meeting').catch((error) => {
            set({
                error: ErrorService.getErrorMessage(error),
                isLoading: false
            });
            throw error;
        });
    },

    clearError: () => set({ error: null }),
}));
