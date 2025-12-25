import { supabase } from './supabase';
import { TaskComment } from '../types';
import { useAuthStore } from '../store/auth.store';

class TaskCommentsService {
    async getComments(taskId: string): Promise<TaskComment[]> {
        const { data, error } = await supabase
            .from('task_comments')
            .select(`
        *,
        user:users(full_name, role)
      `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createComment(taskId: string, content: string): Promise<TaskComment> {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) throw new Error('User ID not found');

        const { data, error } = await supabase
            .from('task_comments')
            .insert([{
                task_id: taskId,
                user_id: userId,
                content
            }])
            .select(`
        *,
        user:users(full_name, role)
      `)
            .single();

        if (error) throw error;
        return data;
    }
}

export const taskCommentsService = new TaskCommentsService();
