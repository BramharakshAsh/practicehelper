import { Firm } from '../types';
import { supabase } from './supabase';

export const SUBSCRIPTION_LIMITS = {
    free: {
        users: 5,
        clients: 25,
        audits_per_month: 1,
        auto_tasks_interval_months: 3,
        excel_imports: 1, // Lifetime
    },
    growth: {
        users: 25, // Can be overridden
        clients: 150, // Can be overridden
        audits_per_month: Infinity,
        auto_tasks_interval_months: 0, // Unlimited
        excel_imports: Infinity,
    }
};

export class SubscriptionService {
    static getLimits(firm: Firm | null) {
        let tier = firm?.subscription_tier || 'free';

        // Downgrade logic if cancelled and grace period over
        if (firm?.subscription_status === 'cancelled' && firm.subscription_end_date) {
            const endDate = new Date(firm.subscription_end_date);
            const now = new Date();
            if (now > endDate) {
                tier = 'free';
            }
        } else if (firm?.subscription_status === 'inactive' || firm?.subscription_status === 'past_due') {
            tier = 'free';
        }

        const defaults = SUBSCRIPTION_LIMITS[tier];

        return {
            maxUsers: firm?.custom_user_limit ?? defaults.users,
            maxClients: firm?.custom_client_limit ?? defaults.clients,
            maxExcelImports: defaults.excel_imports,
            maxAuditsPerMonth: defaults.audits_per_month,
            autoTaskIntervalMonths: defaults.auto_tasks_interval_months,
            tier // returning effective tier for UI use if needed
        };
    }

    static canAddUser(firm: Firm | null, currentCount: number, countToAdd: number = 1): boolean {
        if (!firm) return false;
        const { maxUsers } = this.getLimits(firm);
        return (currentCount + countToAdd) <= maxUsers;
    }

    static canAddClient(firm: Firm | null, currentCount: number, countToAdd: number = 1): boolean {
        if (!firm) return false;
        const { maxClients } = this.getLimits(firm);
        return (currentCount + countToAdd) <= maxClients;
    }

    static canImportExcel(firm: Firm | null): boolean {
        if (!firm) return false;
        const { maxExcelImports } = this.getLimits(firm);
        if (maxExcelImports === Infinity) return true;
        return (firm.excel_imports_count || 0) < maxExcelImports;
    }

    static canCreateAudit(firm: Firm | null, auditsCreatedThisMonth: number): boolean {
        if (!firm) return false;
        const { maxAuditsPerMonth } = this.getLimits(firm);
        if (maxAuditsPerMonth === Infinity) return true;
        return auditsCreatedThisMonth < maxAuditsPerMonth;
    }

    static canRunAutoTasks(firm: Firm | null): { allowed: boolean; nextRunDate?: Date } {
        if (!firm) return { allowed: false };
        const { autoTaskIntervalMonths } = this.getLimits(firm);

        if (autoTaskIntervalMonths === 0) return { allowed: true };
        if (!firm.last_auto_task_run_at) return { allowed: true };

        const lastRun = new Date(firm.last_auto_task_run_at);
        const nextRun = new Date(lastRun);
        nextRun.setMonth(nextRun.getMonth() + autoTaskIntervalMonths);

        // Ensure we don't land on invalid date (e.g. Feb 30)
        if (nextRun.getDate() !== lastRun.getDate()) {
            nextRun.setDate(0);
        }

        const now = new Date();
        return {
            allowed: now >= nextRun,
            nextRunDate: nextRun
        };
    }

    static async incrementExcelImportUsage(firmId: string) {
        const { data: firm } = await supabase
            .from('firms')
            .select('excel_imports_count')
            .eq('id', firmId)
            .single();

        const current = firm?.excel_imports_count || 0;

        const { error } = await supabase
            .from('firms')
            .update({ excel_imports_count: current + 1 })
            .eq('id', firmId);

        if (error) throw error;
    }

    static async getMonthlyAuditCount(firmId: string): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        const { count, error } = await supabase
            .from('audit_plans')
            .select('*', { count: 'exact', head: true })
            .eq('firm_id', firmId)
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

        if (error) {
            console.error('Error counting audits:', error);
            return 0;
        }

        return count || 0;
    }

    static async upgradeToGrowth(firmId: string) {
        const { error } = await supabase
            .from('firms')
            .update({
                subscription_tier: 'growth',
                subscription_status: 'active',
                subscription_updated_at: new Date().toISOString(),
                subscription_end_date: null // clear any past cancellation end date
            })
            .eq('id', firmId);

        if (error) throw error;
    }

    static async cancelSubscription(firmId: string) {
        // Calculate end date (e.g., 30 days from now for simplicity in this mock)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const { error } = await supabase
            .from('firms')
            .update({
                subscription_status: 'cancelled',
                subscription_end_date: endDate.toISOString()
            })
            .eq('id', firmId);

        if (error) throw error;
    }

    static async resumeSubscription(firmId: string) {
        const { error } = await supabase
            .from('firms')
            .update({
                subscription_status: 'active',
                subscription_end_date: null
            })
            .eq('id', firmId);

        if (error) throw error;
    }

    static async updateLastAutoTaskRun(firmId: string) {
        const { error } = await supabase
            .from('firms')
            .update({ last_auto_task_run_at: new Date().toISOString() })
            .eq('id', firmId);

        if (error) throw error;
    }

}
