import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { Firm } from '../types';

class SettingsService {
    async getFirmProfile(): Promise<Firm | null> {
        const user = useAuthStore.getState().user;
        if (!user?.firm_id) return null;

        const { data, error } = await supabase
            .from('firms')
            .select('*')
            .eq('id', user.firm_id)
            .single();

        if (error) throw error;
        return data;
    }

    async updateFirmProfile(updates: Partial<Firm>): Promise<Firm> {
        const user = useAuthStore.getState().user;
        if (!user?.firm_id) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('firms')
            .update(updates)
            .eq('id', user.firm_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export const settingsService = new SettingsService();
