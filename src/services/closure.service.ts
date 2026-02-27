import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { Task } from '../types';

export class ClosureService {
    async getTasksForClosure(onlyUnreported: boolean = false): Promise<Task[]> {
        const user = useAuthStore.getState().user;
        if (!user) return [];

        // Closure is required for active tasks not updated since 6 AM today
        // If it's before 6 AM now, the target is 6 AM yesterday.
        const now = new Date();
        const target6AM = new Date(now);
        target6AM.setHours(6, 0, 0, 0);

        if (now.getHours() < 6) {
            target6AM.setDate(target6AM.getDate() - 1);
        }

        let query = supabase
            .from('tasks')
            .select('*, client:clients(name)')
            .eq('firm_id', user.firm_id)
            .eq('staff_id', user.id)
            .neq('status', 'filed_completed');

        if (onlyUnreported) {
            query = query.eq('is_unreported', true);
        } else {
            query = query.or(`last_closure_at.is.null,last_closure_at.lt.${target6AM.toISOString()}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching closure tasks:', error);
            return [];
        }

        return (data as any) || [];
    }

    async submitClosure(
        taskId: string,
        action: 'no_change' | 'blocked' | 'waiting_client' | 'progress',
        remarks: string = '',
        completion_percentage?: number
    ): Promise<void> {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('Not authenticated');

        let newStatus = undefined;
        if (action === 'waiting_client') newStatus = 'awaiting_client_data';

        const updateData: any = {
            last_closure_at: new Date().toISOString(),
            is_unreported: false
        };

        if (completion_percentage !== undefined) {
            updateData.completion_percentage = completion_percentage;
        }

        if (newStatus) {
            updateData.status = newStatus;
            updateData.status_updated_at = new Date().toISOString();
        }

        // Update task
        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId);

        if (error) throw error;

        // Insert task comment
        let commentContent = '';
        switch (action) {
            case 'no_change': commentContent = 'Daily Closure: No significant change today.'; break;
            case 'blocked': commentContent = `Daily Closure: Blocked.${remarks ? ' ' + remarks : ''}`; break;
            case 'waiting_client': commentContent = `Daily Closure: Waiting on Client.${remarks ? ' ' + remarks : ''}`; break;
            case 'progress': commentContent = `Daily Closure: Progress update.${remarks ? ' ' + remarks : ''}`; break;
        }

        // Don't throw if comment fails, closure is more important
        await supabase.from('task_comments').insert({
            task_id: taskId,
            user_id: user.id,
            content: commentContent
        });
    }
}

export const closureService = new ClosureService();
