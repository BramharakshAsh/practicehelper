import { supabase } from './supabase';

export interface DisciplineStats {
    totalMissedDays: number;
    repeatOffenders: { staffName: string; missedCount: number }[];
}

export interface AgingStats {
    bucket0to3: number;
    bucket4to7: number;
    bucket8Plus: number;
}

export interface OverloadStats {
    staffName: string;
    taskCount: number;
}

export interface ClientDependencyStats {
    clientName: string;
    tasksBlocked: number;
    avgDaysStuck: number;
    hasCriticalTask: boolean; // true if any task > 5 days stuck
}

export class AnalyticsService {
    async getDisciplineStats(firmId: string): Promise<DisciplineStats> {
        // Query the daily_staff_health or directly look at recently updated users.
        // For accurate missed days, we need a historical record, but for MVP, 
        // we can query tasks that are currently unreported, or use the users' unreported_days_count.
        // Since we want recent 30 days, and the cron updates unreported_days_count on the user...
        // Let's use the users table for repeat offenders.

        const { data: users, error } = await supabase
            .from('users')
            .select('full_name, unreported_days_count')
            .eq('firm_id', firmId)
            .gt('unreported_days_count', 0)
            .order('unreported_days_count', { ascending: false });

        if (error) throw error;

        let totalMissed = 0;
        const offenders: { staffName: string; missedCount: number }[] = [];

        (users || []).forEach(u => {
            totalMissed += (u.unreported_days_count || 0);
            if (u.unreported_days_count && u.unreported_days_count > 0) {
                offenders.push({
                    staffName: u.full_name || 'Unknown',
                    missedCount: u.unreported_days_count
                });
            }
        });

        return {
            totalMissedDays: totalMissed, // This is a rough aggregate for now
            repeatOffenders: offenders.slice(0, 5) // Top 5
        };
    }

    async getOverdueAging(firmId: string): Promise<AgingStats> {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('due_date')
            .eq('firm_id', firmId)
            .neq('status', 'filed_completed')
            .not('due_date', 'is', null);

        if (error) throw error;

        const stats: AgingStats = { bucket0to3: 0, bucket4to7: 0, bucket8Plus: 0 };
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        (tasks || []).forEach(t => {
            const dueDate = new Date(t.due_date);
            if (dueDate < now) {
                const diffTime = Math.abs(now.getTime() - dueDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 3) stats.bucket0to3++;
                else if (diffDays <= 7) stats.bucket4to7++;
                else stats.bucket8Plus++;
            }
        });

        return stats;
    }

    async getOverloadSnapshot(firmId: string): Promise<OverloadStats[]> {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                staff_id, 
                staff:users!tasks_staff_id_fkey(full_name)
            `)
            .eq('firm_id', firmId)
            .neq('status', 'filed_completed')
            .lte('due_date', nextWeek.toISOString())
            .not('staff_id', 'is', null);

        if (error) throw error;

        const staffCounts = new Map<string, { staffName: string; taskCount: number }>();

        (tasks || []).forEach(t => {
            if (!t.staff_id || !t.staff) return;
            // Handle array or object from join
            const nameStr = Array.isArray(t.staff) ? t.staff[0]?.full_name : (t.staff as any)?.full_name;
            if (!nameStr) return;

            const existing = staffCounts.get(t.staff_id) || { staffName: nameStr, taskCount: 0 };
            existing.taskCount++;
            staffCounts.set(t.staff_id, existing);
        });

        return Array.from(staffCounts.values())
            .sort((a, b) => b.taskCount - a.taskCount);
    }

    async getClientDependencyStats(firmId: string): Promise<ClientDependencyStats[]> {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                client_id,
                status_updated_at,
                client:clients(name)
            `)
            .eq('firm_id', firmId)
            .eq('status', 'awaiting_client_data')
            .not('client_id', 'is', null);

        if (error) throw error;

        const clientStats = new Map<string, {
            name: string;
            tasksBlocked: number;
            totalDays: number;
            hasCriticalTask: boolean;
        }>();

        const now = new Date();

        (tasks || []).forEach(t => {
            if (!t.client_id || !t.client) return;
            const clientName = Array.isArray(t.client) ? t.client[0]?.name : (t.client as any)?.name;
            if (!clientName) return;

            let diffDays = 0;
            if (t.status_updated_at) {
                const updatedDate = new Date(t.status_updated_at);
                const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            const existing = clientStats.get(t.client_id) || {
                name: clientName,
                tasksBlocked: 0,
                totalDays: 0,
                hasCriticalTask: false
            };

            existing.tasksBlocked++;
            existing.totalDays += diffDays;
            if (diffDays > 5) {
                existing.hasCriticalTask = true;
            }

            clientStats.set(t.client_id, existing);
        });

        return Array.from(clientStats.values())
            .map(s => ({
                clientName: s.name,
                tasksBlocked: s.tasksBlocked,
                avgDaysStuck: Math.round(s.totalDays / s.tasksBlocked),
                hasCriticalTask: s.hasCriticalTask
            }))
            .sort((a, b) => b.tasksBlocked - a.tasksBlocked)
            .slice(0, 10); // Top 10
    }
}

export const analyticsService = new AnalyticsService();
