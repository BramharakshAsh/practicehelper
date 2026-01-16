import { create } from 'zustand';
import { Document } from '../types';
import { documentsService, DocumentFilters, UploadDocumentParams } from '../services/documents.service';

interface DocumentsState {
    documents: Document[];
    isLoading: boolean;
    error: string | null;

    fetchDocuments: (filters?: DocumentFilters) => Promise<void>;
    uploadDocument: (params: UploadDocumentParams) => Promise<Document>;
    deleteDocument: (id: string, path: string) => Promise<void>;
}

export const useDocuments = create<DocumentsState>((set, get) => ({
    documents: [],
    isLoading: false,
    error: null,

    fetchDocuments: async (filters) => {
        console.log('DocumentsStore: fetchDocuments started', filters);
        set({ isLoading: true, error: null });
        try {
            const documents = await documentsService.getDocuments(filters);
            console.log('DocumentsStore: fetchDocuments success', documents.length);
            set({ documents, isLoading: false });
        } catch (error: any) {
            console.error('DocumentsStore: fetchDocuments error', error);
            set({ error: error.message, isLoading: false });
        }
    },

    uploadDocument: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const newDoc = await documentsService.uploadDocument(params);
            set(state => ({
                documents: [newDoc, ...state.documents],
                isLoading: false
            }));
            return newDoc;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteDocument: async (id, path) => {
        set({ isLoading: true, error: null });
        try {
            await documentsService.deleteDocument(id, path);
            set(state => ({
                documents: state.documents.filter(d => d.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    }
}));
