import { create } from 'zustand';
import { Invoice, TimeEntry, InvoiceTemplate } from '../types';
import { billingService, CreateInvoiceParams } from '../services/billing.service';

interface BillingState {
    invoices: Invoice[];
    templates: InvoiceTemplate[]; // Added templates
    isLoading: boolean;
    hasFetched: boolean; // Note: using a single flag for data fetching state
    error: string | null;

    fetchInvoices: (clientId?: string) => Promise<void>;
    createInvoice: (params: CreateInvoiceParams) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;
    markAsSent: (id: string) => Promise<void>;
    markAsPaid: (id: string) => Promise<void>;

    getBillableTime: (clientId: string) => Promise<TimeEntry[]>;

    // Template Actions
    fetchTemplates: () => Promise<void>;
    createTemplate: (template: Omit<InvoiceTemplate, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
    invoices: [],
    templates: [],
    isLoading: false,
    hasFetched: false,
    error: null,

    fetchInvoices: async (clientId) => {
        set({ isLoading: true, error: null });
        try {
            const invoices = await billingService.getInvoices(clientId);
            set({ invoices, isLoading: false, hasFetched: true });
        } catch (error: any) {
            set({ error: error.message, isLoading: false, hasFetched: true });
        }
    },

    createInvoice: async (params) => {
        set({ isLoading: true, error: null });
        try {
            await billingService.createInvoice(params);
            await get().fetchInvoices();
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteInvoice: async (id) => {
        try {
            await billingService.deleteInvoice(id);
            set(state => ({
                invoices: state.invoices.filter(i => i.id !== id)
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    markAsSent: async (id) => {
        try {
            await billingService.updateInvoiceStatus(id, 'sent');
            set(state => ({
                invoices: state.invoices.map(i => i.id === id ? { ...i, status: 'sent' } : i)
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    markAsPaid: async (id) => {
        try {
            await billingService.updateInvoiceStatus(id, 'paid');
            set(state => ({
                invoices: state.invoices.map(i => i.id === id ? { ...i, status: 'paid' } : i)
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    getBillableTime: async (clientId) => {
        return await billingService.getBillableTime(clientId);
    },

    // Template Implementation
    fetchTemplates: async () => {
        try {
            const templates = await billingService.getTemplates();
            set({ templates, hasFetched: true });
        } catch (error: any) {
            console.error('Failed to fetch templates', error);
            set({ hasFetched: true });
        }
    },

    createTemplate: async (template) => {
        try {
            const newTemplate = await billingService.createTemplate(template);
            set(state => ({ templates: [...state.templates, newTemplate] }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteTemplate: async (id) => {
        try {
            await billingService.deleteTemplate(id);
            set(state => ({ templates: state.templates.filter(t => t.id !== id) }));
        } catch (error: any) {
            set({ error: error.message });
        }
    }
}));
