import { supabase } from './supabase';
import { TaskComment } from '../types';
import { useAuthStore } from '../store/auth.store';

class TaskCommentsService {
    async getComments(taskId: string): Promise<TaskComment[]> {
        console.log('[TaskComments] Fetching comments for task:', taskId);
        const { data, error } = await supabase
            .from('task_comments')
            .select(`
        *,
        user:users(id, full_name, role)
      `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[TaskComments] Error fetching comments:', error);
            throw error;
        }

        console.log('[TaskComments] Fetched', data?.length || 0, 'comments');
        return data || [];
    }

    async createComment(taskId: string, content: string): Promise<TaskComment> {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            console.error('[TaskComments] User ID not found in auth store');
            throw new Error('User ID not found. Please log in again.');
        }

        console.log('[TaskComments] Creating comment:', { taskId, userId, contentLength: content.length });

        const { data, error } = await supabase
            .from('task_comments')
            .insert([{
                task_id: taskId,
                user_id: userId,
                content
            }])
            .select(`
        *,
        user:users(id, full_name, role)
      `)
            .single();

        if (error) {
            console.error('[TaskComments] Error creating comment:', error);
            throw error;
        }

        console.log('[TaskComments] Comment created successfully:', data?.id);
        return data;
    }
}

export const taskCommentsService = new TaskCommentsService();
