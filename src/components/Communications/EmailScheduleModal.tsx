import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Client } from '../../types';
import { EmailTemplate, ClientEmailSchedule } from '../../services/email-automation.service';

interface EmailScheduleModalProps {
    schedule?: ClientEmailSchedule;
    clients: Client[];
    templates: EmailTemplate[];
    onClose: () => void;
    onSave: (schedule: Omit<ClientEmailSchedule, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'last_sent_at'>) => Promise<void>;
}

const EmailScheduleModal: React.FC<EmailScheduleModalProps> = ({
    schedule,
    clients,
    templates,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        client_id: schedule?.client_id || '',
        template_id: schedule?.template_id || '',
        schedule_day: schedule?.schedule_day || 1,
        frequency: schedule?.frequency || 'monthly' as 'monthly' | 'quarterly' | 'yearly',
        is_active: schedule?.is_active ?? true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.client_id || !formData.template_id) {
            setError('Please select a client and template');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save schedule');
        } finally {
            setIsSaving(false);
        }
    };

    const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {schedule ? 'Edit' : 'Create'} Email Schedule
                            </h2>
                            <p className="text-sm text-gray-600">Automate recurring emails to clients</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client *
                        </label>
                        <select
                            value={formData.client_id}
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select client...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Template Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Template *
                        </label>
                        <select
                            value={formData.template_id}
                            onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select template...</option>
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name} ({template.subject})
                                </option>
                            ))}
                        </select>
                        {formData.template_id && (
                            <p className="text-xs text-gray-500 mt-1">
                                Preview: {templates.find(t => t.id === formData.template_id)?.subject}
                            </p>
                        )}
                    </div>

                    {/* Schedule Configuration */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <h3 className="font-medium text-gray-900">Timing Configuration</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Frequency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frequency
                                </label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            {/* Day */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Day of Month
                                </label>
                                <select
                                    value={formData.schedule_day}
                                    onChange={(e) => setFormData({ ...formData, schedule_day: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                    {daysInMonth.map((day) => (
                                        <option key={day} value={day}>
                                            {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600">
                            Email will be sent on day {formData.schedule_day} of every {formData.frequency === 'monthly' ? 'month' : formData.frequency === 'quarterly' ? 'quarter' : 'year'}.
                        </p>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Active (Sending Enabled)
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
                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
                        >
                            {isSaving ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
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

export default EmailScheduleModal;
