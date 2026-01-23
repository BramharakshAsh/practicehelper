import { supabase } from './supabase';
import { Document } from '../types';
import { useAuthStore } from '../store/auth.store';

export type DocumentFilters = {
    clientId?: string;
    taskId?: string;
    category?: string;
    search?: string;
};

export interface UploadDocumentParams {
    file: File;
    clientId: string;
    taskId?: string;
    category: string;
    financialYear?: string;
    period?: string;
    tags?: string[];
    notes?: string;
}

class DocumentsService {
    private BUCKET_NAME = 'firm-documents';

    async uploadDocument(params: UploadDocumentParams): Promise<Document> {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('User not authenticated');

        // 1. Upload file to Storage
        const fileExt = params.file.name.split('.').pop();
        const fileName = `${params.clientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.firm_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, params.file);

        if (uploadError) throw uploadError;

        // 2. Create DB record
        const { data: doc, error: dbError } = await supabase
            .from('documents')
            .insert({
                firm_id: user.firm_id,
                client_id: params.clientId,
                task_id: params.taskId,
                file_name: params.file.name,
                file_type: params.file.type,
                file_size: params.file.size,
                storage_path: filePath,
                category: params.category,
                financial_year: params.financialYear,
                period: params.period,
                uploaded_by: user.id,
                tags: params.tags,
                notes: params.notes,
                version: 1,
            })
            .select('*')
            .single();

        if (dbError) {
            // Cleanup storage if DB insert fails
            await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
            throw dbError;
        }

        return doc;
    }

    async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
        const user = useAuthStore.getState().user;
        if (!user) return [];

        let query = supabase
            .from('documents')
            .select('*, client:clients(name)')
            .eq('firm_id', user.firm_id)
            .eq('is_deleted', false)
            .order('uploaded_at', { ascending: false });

        if (filters?.clientId) query = query.eq('client_id', filters.clientId);
        if (filters?.taskId) query = query.eq('task_id', filters.taskId);
        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.search) {
            // Basic search on name or tags. Note: Supabase text search on arrays or mixed columns can be tricky without specific indexes/extensions.
            // For now, simpler ILIKE on file_name.
            query = query.ilike('file_name', `%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async downloadDocument(path: string): Promise<Blob> {
        const { data, error } = await supabase.storage
            .from(this.BUCKET_NAME)
            .download(path);

        if (error) throw error;
        return data;
    }

    async getPublicUrl(path: string): Promise<string> {
        const { data } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(path);

        return data.publicUrl;
    }

    async deleteDocument(id: string, _storagePath: string): Promise<void> {
        // Soft delete in DB
        const { error: dbError } = await supabase
            .from('documents')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (dbError) throw dbError;

        // Optional: We might want to keep the file in storage for version history or "restore" functionality.
        // For now, let's keep it. If hard delete is needed:
        // await supabase.storage.from(this.BUCKET_NAME).remove([storagePath]);
    }
}

export const documentsService = new DocumentsService();
