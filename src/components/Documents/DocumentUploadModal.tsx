import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { UploadDocumentParams } from '../../services/documents.service';

interface DocumentUploadModalProps {
    onClose: () => void;
    onUpload: (params: UploadDocumentParams) => Promise<void>;
    preselectedClientId?: string;
    preselectedTaskId?: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
    onClose,
    onUpload,
    preselectedClientId,
    preselectedTaskId
}) => {
    const { clients } = useClients();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        clientId: preselectedClientId || '',
        category: 'other',
        financialYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
        period: '',
        notes: '',
        tags: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !formData.clientId) return;

        setUploading(true);
        try {
            await onUpload({
                file,
                clientId: formData.clientId,
                taskId: preselectedTaskId,
                category: formData.category,
                financialYear: formData.financialYear,
                period: formData.period,
                notes: formData.notes,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            });
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* File Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileText className="h-10 w-10 text-blue-500 mb-2" />
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="mt-2 text-xs text-red-500 hover:text-red-700"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center cursor-pointer">
                                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, Excel (Max 10MB)</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {!preselectedClientId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                                <select
                                    required
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Select a client</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="other">Other</option>
                                    <option value="income">Income Proof</option>
                                    <option value="expense">Expense Proof</option>
                                    <option value="return">Filed Return</option>
                                    <option value="acknowledgment">Acknowledgment</option>
                                    <option value="notice">Notice</option>
                                    <option value="kyc">KYC</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
                                <input
                                    type="text"
                                    value={formData.financialYear}
                                    onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                                    placeholder="e.g. 2024-25"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="e.g. urgent, audit, q1"
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!file || !formData.clientId || uploading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {uploading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentUploadModal;
