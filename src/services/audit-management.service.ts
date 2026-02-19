import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { AuditPlan, AuditChecklistItem, AuditPlanTemplate } from '../types';
import { devLog, devError } from './logger';

class AuditManagementService {
    async getAuditPlans(): Promise<AuditPlan[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];
        devLog('[AuditService] getAuditPlans started for firm', firmId);

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
            devError('[AuditService] getAuditPlans error', error);
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

        // Build a tree in memory to ensure we insert parents before children
        const itemMap = new Map<string, any>();
        const roots: any[] = [];

        // 1. Initialize map and find roots
        templateItems.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] });
        });

        // 2. Build hierarchy
        templateItems.forEach(item => {
            if (item.parent_id && itemMap.has(item.parent_id)) {
                itemMap.get(item.parent_id).children.push(itemMap.get(item.id));
            } else {
                roots.push(itemMap.get(item.id));
            }
        });

        // 3. Recursive insertion function
        const insertNode = async (node: any, parentId: string | null = null) => {
            const { data: newItem, error: insertError } = await supabase
                .from('audit_checklist_items')
                .insert({
                    audit_id: auditId,
                    parent_id: parentId,
                    title: node.title,
                    description: node.description,
                    order_index: node.order_index,
                    is_completed: false
                })
                .select()
                .single();

            if (insertError) {
                console.error('Failed to insert template item', insertError);
                return;
            }

            // Insert children in parallel
            if (node.children && node.children.length > 0) {
                await Promise.all(node.children.map((child: any) => insertNode(child, newItem.id)));
            }
        };

        // 4. Start insertion from roots in parallel
        await Promise.all(roots.map(root => insertNode(root, null)));
    }

    async getPotentialAuditTasks() {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];
        devLog('[AuditService] getPotentialAuditTasks started', firmId);

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
            devError('[AuditService] getPotentialAuditTasks error', error);
            throw error;
        }

        // Filter in JS for robustness
        return (data || []).filter((task: any) =>
            task.compliance_type?.name?.toLowerCase().includes('audit') ||
            task.compliance_type?.code?.toLowerCase().includes('audit') ||
            task.title?.toLowerCase().includes('audit')
        );
    }
    async createTemplateFromAudit(auditId: string, name: string, description: string): Promise<string> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        // 1. Create the template
        const { data: template, error: templateError } = await supabase
            .from('audit_plan_templates')
            .insert({
                firm_id: firmId,
                name: name,
                description: description,
                is_active: true
            })
            .select()
            .single();

        if (templateError) throw templateError;

        // 2. Fetch existing checklist items
        const checklistItems = await this.getAuditChecklist(auditId);

        // 3. Helper to recursively insert items
        const insertItems = async (items: AuditChecklistItem[], parentId: string | null = null) => {
            for (const item of items) {
                const { data: newItem, error: itemError } = await supabase
                    .from('audit_template_items')
                    .insert({
                        template_id: template.id,
                        parent_id: parentId,
                        title: item.title,
                        description: item.description,
                        order_index: item.order_index
                    })
                    .select()
                    .single();

                if (itemError) {
                    console.error('Failed to save template item', itemError);
                    continue; // Skip failed items but try to continue
                }

                if (item.children && item.children.length > 0) {
                    await insertItems(item.children, newItem.id);
                }
            }
        };

        await insertItems(checklistItems);

        return template.id;
    }
}

export const auditManagementService = new AuditManagementService();
