import { supabase } from './supabase';
import { Invoice, InvoiceItem, Payment, TimeEntry, InvoiceTemplate } from '../types';
import { useAuthStore } from '../store/auth.store';

export type CreateInvoiceParams = {
    clientId: string;
    issueDate: string;
    dueDate: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        type: 'service' | 'reimbursement';
        timeEntryId?: string;
    }[];
    notes?: string;
    terms?: string;
    isGst: boolean;
    gstType?: 'intra' | 'inter';
};

class BillingService {

    async getInvoices(clientId?: string): Promise<Invoice[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];

        let query = supabase
            .from('invoices')
            .select(`
                *,
                client:clients(name, email),
                items:invoice_items(*)
            `)
            .eq('firm_id', firmId)
            .order('issue_date', { ascending: false });

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async getInvoice(id: string): Promise<Invoice> {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                client:clients(*),
                items:invoice_items(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('User not authenticated');

        // 1. Increment and Get Next Sequence (Atomic-ish)
        const { data: updatedFirm, error: seqError } = await supabase
            .from('firms')
            .update({
                // We use a raw SQL increment if possible, but Supabase JS client doesn't support 'invoice_sequence + 1' easily in update.
                // So we rely on fetching first or optimistic. OR we fix the previous bug where updates might fail.
                // Better approach: fetch, increment, update.
            })
            // actually, let's fix the logic to be: Fetch -> Calculate -> Insert Invoice -> Update Seq.
            // If Insert fails (duplicate), we catch, re-fetch seq, retry? 
            // Simplified: Update seq FIRST to reserve it.
            .select('invoice_prefix, invoice_sequence')
            .eq('id', user.firm_id)
            .single();

        // Let's do the manual read-update for now, but handle the update properly.
        const { data: firm } = await supabase
            .from('firms')
            .select('invoice_prefix, invoice_sequence')
            .eq('id', user.firm_id)
            .single();

        const prefix = firm?.invoice_prefix || 'INV-';
        const currentSeq = firm?.invoice_sequence || 1;
        const nextSeq = currentSeq + 1;

        // Update sequence IMMEDIATELY to 'reserve' it (or rather, the one we are about to use is currentSeq, so we update to nextSeq)
        // Wait, usually 'invoice_sequence' stores the NEXT available or the LAST used? 
        // Let's assume it stores the NEXT available.
        const invoiceNumber = `${prefix}${currentSeq.toString().padStart(6, '0')}`;

        await supabase
            .from('firms')
            .update({ invoice_sequence: nextSeq })
            .eq('id', user.firm_id);

        // ... Calculations ...
        let subtotal = 0;
        let reimbursementTotal = 0;

        params.items.forEach(item => {
            const amount = item.quantity * item.unitPrice;
            if (item.type === 'reimbursement') {
                reimbursementTotal += amount;
            } else {
                subtotal += amount;
            }
        });

        const taxRate = params.isGst ? 18 : 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount + reimbursementTotal;

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                firm_id: user.firm_id,
                client_id: params.clientId,
                invoice_number: invoiceNumber,
                issue_date: params.issueDate,
                due_date: params.dueDate,
                subtotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                paid_amount: 0,
                balance_amount: totalAmount,
                notes: params.notes,
                terms: params.terms || 'Payment due within 15 days.',
                status: 'draft',
                is_gst: params.isGst,
                gst_type: params.isGst ? (params.gstType || 'intra') : null
            })
            .select()
            .single();

        if (invoiceError) throw invoiceError;

        const itemsToInsert = params.items.map(item => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            type: item.type,
            time_entry_id: item.timeEntryId
        }));

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

        if (itemsError) {
            await supabase.from('invoices').delete().eq('id', invoice.id);
            throw itemsError;
        }

        const timeEntryIds = params.items
            .map(i => i.timeEntryId)
            .filter((id): id is string => !!id);

        if (timeEntryIds.length > 0) {
            await supabase
                .from('time_entries')
                .update({ is_billable: false, notes: `Billed in ${invoiceNumber}` })
                .in('id', timeEntryIds);
        }

        return this.getInvoice(invoice.id);
    }

    async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
        const { error } = await supabase
            .from('invoices')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }

    async deleteInvoice(id: string): Promise<void> {
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async getBillableTime(clientId: string): Promise<TimeEntry[]> {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('client_id', clientId);
        if (!tasks || tasks.length === 0) return [];

        const taskIds = tasks.map(t => t.id);

        const { data, error } = await supabase
            .from('time_entries')
            .select('*, task:tasks(title)') // Join task to get title
            .in('task_id', taskIds)
            .eq('is_billable', true);

        if (error) throw error;
        return data || [];
    }

    // Template Methods
    async getTemplates(): Promise<InvoiceTemplate[]> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) return [];

        const { data, error } = await supabase
            .from('invoice_templates')
            .select('*')
            .eq('firm_id', firmId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createTemplate(template: Omit<InvoiceTemplate, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<InvoiceTemplate> {
        const firmId = useAuthStore.getState().user?.firm_id;
        if (!firmId) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('invoice_templates')
            .insert({ ...template, firm_id: firmId })
            .select()
            .single();

        if (error) {
            console.error("Error creating template", error);
            throw error;
        }
        return data;
    }

    async deleteTemplate(id: string): Promise<void> {
        const { error } = await supabase
            .from('invoice_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const billingService = new BillingService();
