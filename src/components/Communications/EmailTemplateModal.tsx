import React, { useState } from 'react';
import { X, Mail, Info } from 'lucide-react';
import { EmailTemplate } from '../../services/email-automation.service';

interface EmailTemplateModalProps {
    template?: EmailTemplate;
    onClose: () => void;
    onSave: (template: Omit<EmailTemplate, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
    template,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        name: template?.name || '',
        subject: template?.subject || '',
        body: template?.body || '',
        template_type: template?.template_type || 'reminder' as 'reminder' | 'invoice' | 'general',
        is_active: template?.is_active ?? true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.subject || !formData.body) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {template ? 'Edit' : 'Create'} Email Template
                            </h2>
                            <p className="text-sm text-gray-600">Design automated email content</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Template Name & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Template Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Monthly GST Reminder"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <select
                                value={formData.template_type}
                                onChange={(e) => setFormData({ ...formData, template_type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="reminder">Reminder</option>
                                <option value="invoice">Invoice</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Subject *
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="e.g., Reminder: GST Returns Due"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Supports variables: {'{{client_name}}'}
                        </p>
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Body (HTML supported) *
                        </label>
                        <textarea
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            placeholder="<p>Dear {{client_name}},</p>..."
                            required
                        />
                        <div className="flex items-start mt-2 space-x-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <Info className="h-4 w-4 flex-shrink-0" />
                            <div>
                                <p className="font-medium mb-1">Available Variables:</p>
                                <ul className="list-disc list-inside space-y-0.5 ml-1">
                                    <li><code>{'{{client_name}}'}</code> - Business/Client Name</li>
                                    <li><code>{'{{contact_person}}'}</code> - Contact Person Name</li>
                                    <li><code>{'{{email}}'}</code> - Client Email Address</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Active Template
                        </label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                        >
                            {isSaving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailTemplateModal;
