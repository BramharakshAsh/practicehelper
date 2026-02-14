import { supabase } from './supabase.js';
import { TaskSummary } from './HtmlRenderer.js';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export class TaskSummaryService {
    static async getUserTaskSummary(userId: string): Promise<TaskSummary> {
        const today = new Date();
        const todayEnd = endOfDay(today);
        const tomorrowStart = startOfDay(addDays(today, 1));
        const tomorrowEnd = endOfDay(addDays(today, 1));

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
        *,
        client:clients(name),
        staff:users!tasks_staff_id_fkey(full_name)
      `)
            .eq('staff_id', userId)
            .neq('status', 'filed_completed');

        if (error) throw error;

        const summary: TaskSummary = {
            overdue: [],
            today: [],
            tomorrow: [],
            remaining: [],
            review: [],
            awaiting_client: [],
            totalCount: tasks.length
        };

        tasks.forEach(task => {
            const dueDate = new Date(task.due_date);

            // Overdue
            if (dueDate < today && task.status !== 'filed_completed') {
                summary.overdue.push(task);
            }

            // Today
            if (dueDate >= startOfDay(today) && dueDate <= todayEnd) {
                summary.today.push(task);
            }

            // Tomorrow
            if (dueDate >= tomorrowStart && dueDate <= tomorrowEnd) {
                summary.tomorrow.push(task);
            }

            // Remaining
            if (dueDate > tomorrowEnd) {
                summary.remaining.push(task);
            }

            // Status based
            if (task.status === 'ready_for_review') {
                summary.review.push(task);
            }
            if (task.status === 'awaiting_client_data') {
                summary.awaiting_client.push(task);
            }
        });

        return summary;
    }

    static async getFirmTaskSummary(firmId: string): Promise<TaskSummary> {
        const today = new Date();
        const todayEnd = endOfDay(today);
        const tomorrowStart = startOfDay(addDays(today, 1));
        const tomorrowEnd = endOfDay(addDays(today, 1));

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
        *,
        client:clients(name),
        staff:users!tasks_staff_id_fkey(full_name)
      `)
            .eq('firm_id', firmId)
            .neq('status', 'filed_completed');

        if (error) throw error;

        const summary: TaskSummary = {
            overdue: [],
            today: [],
            tomorrow: [],
            remaining: [],
            review: [],
            awaiting_client: [],
            totalCount: tasks.length
        };

        tasks.forEach(task => {
            const dueDate = new Date(task.due_date);

            if (dueDate < today && task.status !== 'filed_completed') {
                summary.overdue.push(task);
            }
            if (dueDate >= startOfDay(today) && dueDate <= todayEnd) {
                summary.today.push(task);
            }
            if (dueDate >= tomorrowStart && dueDate <= tomorrowEnd) {
                summary.tomorrow.push(task);
            }
            if (dueDate > tomorrowEnd) {
                summary.remaining.push(task);
            }
            if (task.status === 'ready_for_review') {
                summary.review.push(task);
            }
            if (task.status === 'awaiting_client_data') {
                summary.awaiting_client.push(task);
            }
        });

        return summary;
    }

    static async getTasksCreatedByUser(userId: string): Promise<TaskSummary> {
        const today = new Date();
        const todayEnd = endOfDay(today);
        const tomorrowStart = startOfDay(addDays(today, 1));
        const tomorrowEnd = endOfDay(addDays(today, 1));

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
        *,
        client:clients(name),
        staff:users!tasks_staff_id_fkey(full_name)
      `)
            .eq('assigned_by', userId)
            .neq('status', 'filed_completed');

        if (error) throw error;

        const summary: TaskSummary = {
            overdue: [],
            today: [],
            tomorrow: [],
            remaining: [],
            review: [],
            awaiting_client: [],
            totalCount: tasks.length
        };

        tasks.forEach(task => {
            const dueDate = new Date(task.due_date);

            if (dueDate < today && task.status !== 'filed_completed') {
                summary.overdue.push(task);
            }
            if (dueDate >= startOfDay(today) && dueDate <= todayEnd) {
                summary.today.push(task);
            }
            if (dueDate >= tomorrowStart && dueDate <= tomorrowEnd) {
                summary.tomorrow.push(task);
            }
            if (dueDate > tomorrowEnd) {
                summary.remaining.push(task);
            }
            if (task.status === 'ready_for_review') {
                summary.review.push(task);
            }
            if (task.status === 'awaiting_client_data') {
                summary.awaiting_client.push(task);
            }
        });

        return summary;
    }
}
