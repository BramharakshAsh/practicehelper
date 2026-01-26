import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

export interface RecurringTaskRule {
    id: string;
    firm_id: string;
    compliance_type_id?: string;
    client_id: string;
    staff_id?: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    execution_day: number;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    period?: string; // e.g., "Q1 FY2024", "FY2024-25"
    is_active: boolean;
    last_generated_at?: string;
    created_at: string;
    updated_at: string;
}

class RecurringTasksService {
    async getRecurringRules(): Promise<RecurringTaskRule[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];

        const { data, error } = await supabase
            .from('recurring_task_rules')
            .select(`
        *,
        client:clients(id, name),
        compliance_type:compliance_types(id, name, code),
        staff:users(id, full_name, email)
      `)
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createRecurringRule(
        rule: Omit<RecurringTaskRule, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'last_generated_at'>
    ): Promise<RecurringTaskRule> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('recurring_task_rules')
            .insert({ ...rule, firm_id: firmId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateRecurringRule(
        id: string,
        updates: Partial<RecurringTaskRule>
    ): Promise<RecurringTaskRule> {
        const { data, error } = await supabase
            .from('recurring_task_rules')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteRecurringRule(id: string): Promise<void> {
        const { error } = await supabase
            .from('recurring_task_rules')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async toggleRuleStatus(id: string, isActive: boolean): Promise<void> {
        await this.updateRecurringRule(id, { is_active: isActive });
    }
}

export const recurringTasksService = new RecurringTasksService();
