import React from 'react';
import { FileText, Download, Trash2, Calendar, Tag } from 'lucide-react';
import { Document } from '../../types';
import { documentsService } from '../../services/documents.service';

interface DocumentListProps {
    documents: Document[];
    onDelete?: (id: string, path: string) => void;
    showClientName?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete, showClientName = false }) => {

    const handleDownload = async (doc: Document) => {
        try {
            const blob = await documentsService.downloadDocument(doc.storage_path);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.file_name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download document');
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">Upload documents related to this task or client.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul className="divide-y divide-gray-200">
                {documents.map((doc) => (
                    <li key={doc.id}>
                        <div className="block hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center truncate">
                                        <div className="flex-shrink-0 mr-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="truncate">
                                            <div className="flex text-sm">
                                                <p className="font-medium text-blue-600 truncate mr-2">{doc.file_name}</p>
                                                {showClientName && doc.client && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                                                        {doc.client.name}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {doc.category}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                                <p className="mr-4">{formatFileSize(doc.file_size)}</p>
                                                <p className="flex items-center mr-4">
                                                    <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                                </p>
                                                {doc.tags && doc.tags.length > 0 && (
                                                    <div className="flex items-center">
                                                        <Tag className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" />
                                                        <span className="text-xs">{doc.tags.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Download"
                                        >
                                            <Download className="h-5 w-5" />
                                        </button>
                                        {onDelete && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this document?')) {
                                                        onDelete(doc.id, doc.storage_path);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DocumentList;
