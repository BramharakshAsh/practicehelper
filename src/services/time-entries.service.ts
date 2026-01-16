import { supabase } from './supabase';
import { TimeEntry } from '../types';
import { useAuthStore } from '../store/auth.store';

export type TimeEntryParams = {
    taskId: string;
    startedAt: string;
    endedAt?: string;
    durationMinutes?: number;
    isBillable?: boolean;
    notes?: string;
    entryType: 'timer' | 'manual';
};

class TimeEntriesService {

    async createTimeEntry(params: TimeEntryParams): Promise<TimeEntry> {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('time_entries')
            .insert({
                firm_id: user.firm_id,
                task_id: params.taskId,
                staff_id: user.id,
                started_at: params.startedAt,
                ended_at: params.endedAt,
                duration_minutes: params.durationMinutes,
                is_billable: params.isBillable ?? true,
                notes: params.notes,
                entry_type: params.entryType
            })
            .select('*')
            .single();

        if (error) throw error;
        return data;
    }

    async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
        const { data, error } = await supabase
            .from('time_entries')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    }

    async getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
        const { data, error } = await supabase
            .from('time_entries')
            .select('*, staff:users(full_name)')
            .eq('task_id', taskId)
            .order('started_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getMyTimeEntries(limit = 50): Promise<TimeEntry[]> {
        const user = useAuthStore.getState().user;
        if (!user) return [];

        const { data, error } = await supabase
            .from('time_entries')
            .select('*, task:tasks(title, client:clients(name))')
            .eq('staff_id', user.id)
            .order('started_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
}

export const timeEntriesService = new TimeEntriesService();
