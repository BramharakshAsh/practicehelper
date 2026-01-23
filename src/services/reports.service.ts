import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

export interface FinancialMetrics {
    totalRevenue: number;
    collectedRevenue: number;
    outstandingAmount: number;
    revenueByMonth: { month: string; billed: number; collected: number }[];
}

export interface TaskMetrics {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    byStatus: { name: string; value: number; color: string }[];
}

export interface StaffMetrics {
    id: string;
    name: string;
    completedTasks: number;
    billableHours: number;
}

class ReportsService {

    async getFinancialMetrics(startDate?: Date, endDate?: Date): Promise<FinancialMetrics> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        let query = supabase
            .from('invoices')
            .select('amount:total_amount, paid_amount, balance_amount, issue_date, status')
            .eq('firm_id', firmId)
            .neq('status', 'void');

        if (startDate) query = query.gte('issue_date', startDate.toISOString());
        if (endDate) query = query.lte('issue_date', endDate.toISOString());

        const { data: invoices, error } = await query;
        if (error) throw error;

        let totalRevenue = 0;
        let collectedRevenue = 0;
        let outstandingAmount = 0;
        const monthlyData: Record<string, { billed: number, collected: number }> = {};

        invoices?.forEach(inv => {
            totalRevenue += inv.amount || 0;
            collectedRevenue += inv.paid_amount || 0;
            outstandingAmount += inv.balance_amount || 0;

            const month = new Date(inv.issue_date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!monthlyData[month]) monthlyData[month] = { billed: 0, collected: 0 };
            monthlyData[month].billed += inv.amount || 0;
            monthlyData[month].collected += inv.paid_amount || 0;
        });

        const revenueByMonth = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            billed: data.billed,
            collected: data.collected
        }));

        return { totalRevenue, collectedRevenue, outstandingAmount, revenueByMonth };
    }

    async getTaskMetrics(startDate?: Date, endDate?: Date): Promise<TaskMetrics> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        let query = supabase
            .from('tasks')
            .select('status, due_date')
            .eq('firm_id', firmId);

        if (startDate) query = query.gte('due_date', startDate.toISOString());
        if (endDate) query = query.lte('due_date', endDate.toISOString());

        const { data: tasks, error } = await query;
        if (error) throw error;

        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'filed_completed').length || 0;
        const overdueTasks = tasks?.filter(t => t.status !== 'filed_completed' && new Date(t.due_date) < new Date()).length || 0;

        const counts: Record<string, number> = {
            'assigned': 0,
            'in_progress': 0,
            'awaiting_client_data': 0,
            'ready_for_review': 0,
            'filed_completed': 0
        };

        tasks?.forEach(t => {
            if (counts[t.status] !== undefined) counts[t.status]++;
        });

        const byStatus = [
            { name: 'Assigned', value: counts['assigned'], color: '#94a3b8' },
            { name: 'In Progress', value: counts['in_progress'], color: '#3b82f6' },
            { name: 'Awaiting Data', value: counts['awaiting_client_data'], color: '#f59e0b' },
            { name: 'Review', value: counts['ready_for_review'], color: '#8b5cf6' },
            { name: 'Completed', value: counts['filed_completed'], color: '#22c55e' },
        ];

        return { totalTasks, completedTasks, overdueTasks, byStatus };
    }

    async getStaffMetrics(startDate?: Date, endDate?: Date): Promise<StaffMetrics[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        // Get Staff
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('id, name')
            .eq('firm_id', firmId)
            .eq('is_active', true);

        if (staffError) throw staffError;

        // Get Tasks
        let taskQuery = supabase.from('tasks').select('staff_id, status').eq('firm_id', firmId).eq('status', 'filed_completed');
        if (startDate) taskQuery = taskQuery.gte('updated_at', startDate.toISOString());
        if (endDate) taskQuery = taskQuery.lte('updated_at', endDate.toISOString());
        const { data: tasks } = await taskQuery;

        // Get Time Entries (Billable)
        let timeQuery = supabase.from('time_entries').select('staff_id, duration_minutes').eq('firm_id', firmId).eq('is_billable', true);
        if (startDate) timeQuery = timeQuery.gte('started_at', startDate.toISOString());
        if (endDate) timeQuery = timeQuery.lte('started_at', endDate.toISOString());
        const { data: timeEntries } = await timeQuery;

        const metrics = staff?.map(s => {
            const userTasks = tasks?.filter(t => t.staff_id === s.id).length || 0;
            const userMinutes = timeEntries?.filter(t => t.staff_id === s.id).reduce((sum, t) => sum + t.duration_minutes, 0) || 0;
            return {
                id: s.id,
                name: s.name,
                completedTasks: userTasks,
                billableHours: parseFloat((userMinutes / 60).toFixed(1))
            };
        }) || [];

        return metrics.sort((a, b) => b.completedTasks - a.completedTasks);
    }
}

export const reportsService = new ReportsService();
