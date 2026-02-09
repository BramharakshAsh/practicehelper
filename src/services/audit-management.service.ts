import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { AuditPlan, AuditChecklistItem, AuditPlanTemplate } from '../types';

class AuditManagementService {
    async getAuditPlans(): Promise<AuditPlan[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];
        console.log('AuditService: getAuditPlans started for firm', firmId);

        const { data, error } = await supabase
            .from('audit_plans')
            .select(`
        *,
        client:clients(*),
        lead_staff:users!audit_plans_lead_staff_id_fkey(*)
      `)
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('AuditService: getAuditPlans error', error);
            throw error;
        }

        // Transform lead_staff data: users table has 'full_name', but Staff expects 'name'
        return (data || []).map(plan => ({
            ...plan,
            lead_staff: plan.lead_staff ? {
                ...plan.lead_staff,
                name: plan.lead_staff.full_name || plan.lead_staff.name || 'Unknown',
            } : null
        }));
    }

    async getAuditPlan(id: string): Promise<AuditPlan> {
        const { data, error } = await supabase
            .from('audit_plans')
            .select(`
        *,
        client:clients(*),
        lead_staff:users!audit_plans_lead_staff_id_fkey(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Transform lead_staff data: users table has 'full_name', but Staff expects 'name'
        return {
            ...data,
            lead_staff: data.lead_staff ? {
                ...data.lead_staff,
                name: data.lead_staff.full_name || data.lead_staff.name || 'Unknown',
            } : null
        };
    }

    async createAuditPlan(plan: Omit<AuditPlan, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'progress'>): Promise<AuditPlan> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('audit_plans')
            .insert({ ...plan, firm_id: firmId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateAuditPlan(id: string, updates: Partial<AuditPlan>): Promise<AuditPlan> {
        const { data, error } = await supabase
            .from('audit_plans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getAuditChecklist(auditId: string): Promise<AuditChecklistItem[]> {
        const { data, error } = await supabase
            .from('audit_checklist_items')
            .select(`
        *,
        assigned_staff:users!audit_checklist_items_assigned_to_fkey(*)
      `)
            .eq('audit_id', auditId)
            .order('order_index', { ascending: true });

        if (error) throw error;
        return this.buildTree(data || []);
    }

    private buildTree(items: any[]): AuditChecklistItem[] {
        const map = new Map();
        const tree: AuditChecklistItem[] = [];

        items.forEach(item => {
            map.set(item.id, { ...item, children: [] });
        });

        items.forEach(item => {
            const node = map.get(item.id);
            if (item.parent_id && map.has(item.parent_id)) {
                map.get(item.parent_id).children.push(node);
            } else {
                tree.push(node);
            }
        });

        return tree;
    }

    async createChecklistItem(item: Omit<AuditChecklistItem, 'id' | 'created_at' | 'updated_at'>): Promise<AuditChecklistItem> {
        const { data, error } = await supabase
            .from('audit_checklist_items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateChecklistItem(id: string, updates: Partial<AuditChecklistItem>): Promise<AuditChecklistItem> {
        const { data, error } = await supabase
            .from('audit_checklist_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteChecklistItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('audit_checklist_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async deleteAuditPlan(id: string): Promise<void> {
        const { error } = await supabase
            .from('audit_plans')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async getTemplates(): Promise<AuditPlanTemplate[]> {
        const firmId = useAuthStore.getState().user?.firm_id;

        let query = supabase.from('audit_plan_templates').select('*');

        if (firmId) {
            query = query.or(`firm_id.is.null,firm_id.eq.${firmId}`);
        } else {
            query = query.is('firm_id', null);
        }

        const { data, error } = await query.order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createAuditFromTemplate(templateId: string, auditId: string): Promise<void> {
        const { data: templateItems, error: templateError } = await supabase
            .from('audit_template_items')
            .select('*')
            .eq('template_id', templateId)
            .order('order_index', { ascending: true });

        if (templateError) throw templateError;
        if (!templateItems) return;

        const idMap = new Map<string, string>();

        for (const item of templateItems) {
            const { data: newItem, error: insertError } = await supabase
                .from('audit_checklist_items')
                .insert({
                    audit_id: auditId,
                    parent_id: item.parent_id ? idMap.get(item.parent_id) : null,
                    title: item.title,
                    description: item.description,
                    order_index: item.order_index,
                    is_completed: false
                })
                .select()
                .single();

            if (insertError) throw insertError;
            idMap.set(item.id, newItem.id);
        }
    }

    async getPotentialAuditTasks() {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];
        console.log('AuditService: getPotentialAuditTasks started', firmId);

        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                client:clients(*),
                compliance_type:compliance_types(*)
            `)
            .eq('firm_id', firmId)
            .is('audit_id', null)
            .order('due_date', { ascending: true });

        if (error) {
            console.error('AuditService: getPotentialAuditTasks error', error);
            throw error;
        }

        // Filter in JS for robustness
        return (data || []).filter((task: any) =>
            task.compliance_type?.name?.toLowerCase().includes('audit') ||
            task.compliance_type?.code?.toLowerCase().includes('audit') ||
            task.title?.toLowerCase().includes('audit')
        );
    }
}

export const auditManagementService = new AuditManagementService();
