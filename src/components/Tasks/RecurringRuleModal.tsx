import React, { useState } from 'react';
import { X, Calendar, Repeat } from 'lucide-react';
import { Client, Staff, ComplianceType } from '../../types';
import { RecurringTaskRule } from '../../services/recurring-tasks.service';

interface RecurringRuleModalProps {
    rule?: RecurringTaskRule;
    clients: Client[];
    staff: Staff[];
    complianceTypes: ComplianceType[];
    onClose: () => void;
    onSave: (rule: Omit<RecurringTaskRule, 'id' | 'firm_id' | 'created_at' | 'updated_at' | 'last_generated_at'>) => Promise<void>;
}

const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({
    rule,
    clients,
    staff,
    complianceTypes,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        client_id: rule?.client_id || '',
        staff_id: rule?.staff_id || '',
        compliance_type_id: rule?.compliance_type_id || '',
        title: rule?.title || '',
        description: rule?.description || '',
        priority: rule?.priority || 'medium' as 'low' | 'medium' | 'high',
        execution_day: rule?.execution_day || 1,
        frequency: rule?.frequency || 'monthly' as 'monthly' | 'quarterly' | 'yearly',
        period: rule?.period || '',
        is_active: rule?.is_active ?? true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.client_id) {
            setError('Please select a client');
            return;
        }

        if (!formData.title) {
            setError('Please enter a task title');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save rule');
        } finally {
            setIsSaving(false);
        }
    };

    const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Repeat className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {rule ? 'Edit' : 'Create'} Recurring Task Rule
                            </h2>
                            <p className="text-sm text-gray-600">Auto-generate tasks on a schedule</p>
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
                    {/* Client Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client *
                        </label>
                        <select
                            value={formData.client_id}
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                    {/* Compliance Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Compliance Type
                        </label>
                        <select
                            value={formData.compliance_type_id}
                            onChange={(e) => setFormData({ ...formData, compliance_type_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">None</option>
                            {complianceTypes.map((ct) => (
                                <option key={ct.id} value={ct.id}>
                                    {ct.name} ({ct.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Task Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., GSTR-1 Filing"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Additional details..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        {/* Staff Assignment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign To
                            </label>
                            <select
                                value={formData.staff_id}
                                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Unassigned</option>
                                {staff.map((s) => (
                                    <option key={s.id} value={s.user_id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Schedule Configuration */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <h3 className="font-medium text-gray-900">Schedule Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Frequency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frequency
                                </label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            {/* Execution Day */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Day of Month
                                </label>
                                <select
                                    value={formData.execution_day}
                                    onChange={(e) => setFormData({ ...formData, execution_day: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                            Tasks will be auto-generated on the {formData.execution_day}
                            {formData.execution_day === 1 ? 'st' : formData.execution_day === 2 ? 'nd' : formData.execution_day === 3 ? 'rd' : 'th'} day of each {formData.frequency === 'monthly' ? 'month' : formData.frequency === 'quarterly' ? 'quarter' : 'year'}
                        </p>

                        {/* Period Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Period (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                placeholder={formData.frequency === 'quarterly' ? 'e.g., Q1 FY2024, Q2 FY2024' : formData.frequency === 'yearly' ? 'e.g., FY2024-25' : 'e.g., Jan 2024'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Specify the period for this task (e.g., {formData.frequency === 'quarterly' ? 'Q1 FY2024' : formData.frequency === 'yearly' ? 'FY2024-25' : 'January 2024'})
                            </p>
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
                            Active (tasks will be generated automatically)
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
                            {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
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

export default RecurringRuleModal;
