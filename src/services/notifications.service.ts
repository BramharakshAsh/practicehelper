import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

export interface Notification {
    id: string;
    firm_id: string;
    user_id: string;
    type: 'task_assigned' | 'task_due' | 'task_completed' | 'client_update' | 'system';
    title: string;
    message?: string;
    related_entity_type?: 'task' | 'client';
    related_entity_id?: string;
    is_read: boolean;
    created_at: string;
}

class NotificationsService {
    async getUnreadNotifications(): Promise<Notification[]> {
        const user = useAuthStore.getState().user;
        if (!user) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getAllNotifications(limit = 20): Promise<Notification[]> {
        const user = useAuthStore.getState().user;
        if (!user) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }

    async markAsRead(id: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw error;
    }

    async markAllAsRead(): Promise<void> {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
    }

    async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .insert(notification);

        if (error) throw error;
    }
}

export const notificationsService = new NotificationsService();
