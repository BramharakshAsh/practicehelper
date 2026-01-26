import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

export interface EmailTemplate {
    id: string;
    firm_id: string;
    name: string;
    subject: string;
    body: string;
    template_type: 'reminder' | 'invoice' | 'general';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ClientEmailSchedule {
    id: string;
    firm_id: string;
    client_id: string;
    template_id: string;
    schedule_day: number;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    is_active: boolean;
    last_sent_at?: string;
    created_at: string;
    updated_at: string;
    // Joins
    client?: { name: string; email: string };
    template?: { name: string };
}

class EmailAutomationService {
    // --- Templates ---

    async getTemplates(): Promise<EmailTemplate[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];

        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createTemplate(template: Omit<EmailTemplate, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('email_templates')
            .insert({ ...template, firm_id: firmId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
        const { data, error } = await supabase
            .from('email_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteTemplate(id: string): Promise<void> {
        const { error } = await supabase
            .from('email_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // --- Schedules ---

    async getSchedules(): Promise<ClientEmailSchedule[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];

        const { data, error } = await supabase
            .from('client_email_schedules')
            .select(`
        *,
        client:clients(name, email),
        template:email_templates(name)
      `)
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createSchedule(schedule: Omit<ClientEmailSchedule, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'last_sent_at'>): Promise<ClientEmailSchedule> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('client_email_schedules')
            .insert({ ...schedule, firm_id: firmId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateSchedule(id: string, updates: Partial<ClientEmailSchedule>): Promise<ClientEmailSchedule> {
        const { data, error } = await supabase
            .from('client_email_schedules')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteSchedule(id: string): Promise<void> {
        const { error } = await supabase
            .from('client_email_schedules')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const emailAutomationService = new EmailAutomationService();
