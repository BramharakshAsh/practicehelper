import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useDocuments } from '../store/documents.store';
import { useClients } from '../hooks/useClients';
import DocumentList from '../components/Documents/DocumentList';
import DocumentUploadModal from '../components/Documents/DocumentUploadModal';

const DocumentsPage: React.FC = () => {
    const { documents, isLoading, fetchDocuments, uploadDocument, deleteDocument } = useDocuments();
    const { clients } = useClients();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchDocuments({
            search: searchTerm,
            clientId: selectedClient || undefined,
            category: selectedCategory || undefined
        });
    }, [searchTerm, selectedClient, selectedCategory]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                    <p className="text-gray-600 mt-1">Manage all your firm's documents in one place.</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Upload Document
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        >
                            <option value="">All Clients</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Categories</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="return">Return</option>
                        <option value="acknowledgment">Acknowledgment</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            {/* Document List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <DocumentList documents={documents} onDelete={deleteDocument} showClientName={true} />
            )}

            {isUploadModalOpen && (
                <DocumentUploadModal
                    onClose={() => setIsUploadModalOpen(false)}
                    onUpload={uploadDocument}
                />
            )}
        </div>
    );
};

export default DocumentsPage;
