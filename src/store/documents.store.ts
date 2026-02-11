import { create } from 'zustand';
import { Document } from '../types';
import { documentsService, DocumentFilters, UploadDocumentParams } from '../services/documents.service';
import { devLog, devError } from '../services/logger';

interface DocumentsState {
    documents: Document[];
    isLoading: boolean;
    hasFetched: boolean;
    error: string | null;

    fetchDocuments: (filters?: DocumentFilters) => Promise<void>;
    uploadDocument: (params: UploadDocumentParams) => Promise<Document>;
    deleteDocument: (id: string, path: string) => Promise<void>;
}

export const useDocuments = create<DocumentsState>((set) => ({
    documents: [],
    isLoading: false,
    hasFetched: false,
    error: null,

    fetchDocuments: async (filters) => {
        devLog('[DocumentsStore] fetchDocuments started', filters);
        set({ isLoading: true, error: null });
        try {
            const documents = await documentsService.getDocuments(filters);
            devLog('[DocumentsStore] fetchDocuments success', documents.length);
            set({ documents, isLoading: false, hasFetched: true });
        } catch (error: any) {
            devError('[DocumentsStore] fetchDocuments error', error);
            set({ error: error.message, isLoading: false, hasFetched: true });
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
