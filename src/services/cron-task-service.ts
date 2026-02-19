import { supabaseAdmin } from '../lib/cron-supabase';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export interface TaskSummary {
    overdue: any[];
    today: any[];
    tomorrow: any[];
    remaining: any[];
    review: any[];
    awaiting_client: any[];
    totalCount: number;
}

export class TaskSummaryService {
    static async getUserTaskSummary(userId: string): Promise<TaskSummary> {
        const today = new Date();
        const todayEnd = endOfDay(today);
        const tomorrowStart = startOfDay(addDays(today, 1));
        const tomorrowEnd = endOfDay(addDays(today, 1));

        const { data: tasks, error } = await supabaseAdmin
            .from('tasks')
            .select(`
        *,
        client:clients(name),
        staff:users!tasks_staff_id_fkey(full_name)
      `)
            .eq('staff_id', userId)
            .neq('status', 'filed_completed');

        if (error) throw error;

        return this.categorizeTasks(tasks || [], today, todayEnd, tomorrowStart, tomorrowEnd);
    }

    static async getFirmTaskSummary(firmId: string): Promise<TaskSummary> {
        const today = new Date();
        const todayEnd = endOfDay(today);
        const tomorrowStart = startOfDay(addDays(today, 1));
        const tomorrowEnd = endOfDay(addDays(today, 1));

        const { data: tasks, error } = await supabaseAdmin
            .from('tasks')
            .select(`
        *,
        client:clients(name),
        staff:users!tasks_staff_id_fkey(full_name)
      `)
            .eq('firm_id', firmId)
            .neq('status', 'filed_completed');

        if (error) throw error;

        return this.categorizeTasks(tasks || [], today, todayEnd, tomorrowStart, tomorrowEnd);
    }

    static async getTasksCreatedByUser(userId: string): Promise<TaskSummary> {
        const today = new Date();
        const todayEnd = endOfDay(today);
        const tomorrowStart = startOfDay(addDays(today, 1));
        const tomorrowEnd = endOfDay(addDays(today, 1));

        const { data: tasks, error } = await supabaseAdmin
            .from('tasks')
            .select(`
        *,
        client:clients(name),
        staff:users!tasks_staff_id_fkey(full_name)
      `)
            .eq('assigned_by', userId)
            .neq('status', 'filed_completed');

        if (error) throw error;

        return this.categorizeTasks(tasks || [], today, todayEnd, tomorrowStart, tomorrowEnd);
    }

    private static categorizeTasks(tasks: any[], today: Date, todayEnd: Date, tomorrowStart: Date, tomorrowEnd: Date): TaskSummary {
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
}
