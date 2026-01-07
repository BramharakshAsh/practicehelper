import { Meeting } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

class MeetingsService {
    async getMeetings(startDate?: Date, endDate?: Date): Promise<Meeting[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];

        let query = supabase
            .from('meetings')
            .select(`
                *,
                client:clients(*),
                staff:staff(*)
            `)
            .eq('firm_id', firmId);

        if (startDate) {
            query = query.gte('start_time', startDate.toISOString());
        }
        if (endDate) {
            query = query.lte('end_time', endDate.toISOString());
        }

        const { data, error } = await query.order('start_time', { ascending: true });

        if (error) throw error;
        return data as Meeting[];
    }

    async createMeeting(meeting: Omit<Meeting, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Meeting> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated or missing firm ID');

        const { data, error } = await supabase
            .from('meetings')
            .insert({
                ...meeting,
                firm_id: firmId,
            })
            .select(`
                *,
                client:clients(*),
                staff:staff(*)
            `)
            .single();

        if (error) throw error;
        return data as Meeting;
    }

    async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
        const { data, error } = await supabase
            .from('meetings')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                client:clients(*),
                staff:staff(*)
            `)
            .single();

        if (error) throw error;
        return data as Meeting;
    }

    async deleteMeeting(id: string): Promise<void> {
        const { error } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const meetingsService = new MeetingsService();
