'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

type Firm = {
    id: string;
    name: string;
    subscription_tier: string;
    subscription_status: string;
    custom_user_limit: number | null;
    custom_client_limit: number | null;
};

interface EditFirmModalProps {
    firm: Firm;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditFirmModal({ firm, isOpen, onClose, onSuccess }: EditFirmModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        subscription_tier: firm.subscription_tier,
        subscription_status: firm.subscription_status,
        custom_user_limit: firm.custom_user_limit === null ? '' : firm.custom_user_limit.toString(),
        custom_client_limit: firm.custom_client_limit === null ? '' : firm.custom_client_limit.toString(),
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = sessionStorage.getItem('superadmin_token');
            const res = await fetch(`/api/superadmin/firms/${firm.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subscription_tier: formData.subscription_tier,
                    subscription_status: formData.subscription_status,
                    custom_user_limit: formData.custom_user_limit === '' ? null : Number(formData.custom_user_limit),
                    custom_client_limit: formData.custom_client_limit === '' ? null : Number(formData.custom_client_limit)
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update firm');
            }

            alert('Firm updated successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update firm details');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl overflow-hidden border dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Firm Requirements</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1 rounded-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Firm: <span className="font-semibold text-blue-600 dark:text-blue-400">{firm.name}</span></p>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="subscription_tier" className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Tier</label>
                        <select
                            id="subscription_tier"
                            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.subscription_tier}
                            onChange={(e) => setFormData(prev => ({ ...prev, subscription_tier: e.target.value }))}
                        >
                            <option value="free">Free</option>
                            <option value="growth">Growth</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="subscription_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Status</label>
                        <select
                            id="subscription_status"
                            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.subscription_status}
                            onChange={(e) => setFormData(prev => ({ ...prev, subscription_status: e.target.value }))}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="past_due">Past Due</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="custom_user_limit" className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Staff Limit (Leave empty for default tier limit)</label>
                        <input
                            id="custom_user_limit"
                            type="number"
                            min="1"
                            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. 10"
                            value={formData.custom_user_limit}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_user_limit: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="custom_client_limit" className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Client Limit (Leave empty for default tier limit)</label>
                        <input
                            id="custom_client_limit"
                            type="number"
                            min="1"
                            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. 500"
                            value={formData.custom_client_limit}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_client_limit: e.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-6">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium border rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
