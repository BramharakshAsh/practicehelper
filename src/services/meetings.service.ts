import { supabase } from './supabase';
import { Meeting } from '../types';
import { useAuthStore } from '../store/auth.store';

class MeetingsService {
    async getMeetings(startDate?: Date, endDate?: Date): Promise<Meeting[]> {
        let query = supabase
            .from('meetings')
            .select(`
        *,
        client:clients(name),
        staff:users!meetings_staff_id_fkey(full_name)
      `)
            .order('start_time', { ascending: true });

        if (startDate) {
            query = query.gte('start_time', startDate.toISOString());
        }
        if (endDate) {
            query = query.lte('start_time', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

    async createMeeting(meeting: Omit<Meeting, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Meeting> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User firm ID not found');

        const { data, error } = await supabase
            .from('meetings')
            .insert([{ ...meeting, firm_id: firmId }])
            .select(`
        *,
        client:clients(name),
        staff:users!meetings_staff_id_fkey(full_name)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
        const { data, error } = await supabase
            .from('meetings')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(`
        *,
        client:clients(name),
        staff:users!meetings_staff_id_fkey(full_name)
      `)
            .single();

        if (error) throw error;
        return data;
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
