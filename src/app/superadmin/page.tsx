'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Edit, Users, Building } from 'lucide-react';
import EditFirmModal from '@/components/Superadmin/EditFirmModal';

type Firm = {
    id: string;
    name: string;
    email: string;
    contact_number: string;
    subscription_tier: string;
    subscription_status: string;
    custom_user_limit: number | null;
    custom_client_limit: number | null;
    staff_count: number;
    client_count: number;
    created_at: string;
};

export default function SuperadminDashboard() {
    const [firms, setFirms] = useState<Firm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);

    const fetchFirms = async () => {
        try {
            setIsLoading(true);
            const token = sessionStorage.getItem('superadmin_token');
            const res = await fetch('/api/superadmin/firms', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFirms(data.firms || []);
            }
        } catch (error) {
            console.error('Failed to fetch firms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFirms();
    }, []);

    const handleUpdateSuccess = () => {
        fetchFirms();
    };

    const filteredFirms = firms.filter(firm =>
        firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firm.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Firms Directory</h2>
                    <p className="text-gray-500">Manage subscriptions and limits for all registered CA firms.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                        placeholder="Search firms..."
                        className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b dark:border-gray-700">
                    <h3 className="font-semibold text-lg">All Firms ({filteredFirms.length})</h3>
                </div>
                <div className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : filteredFirms.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No firms found matching "{searchTerm}"
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3">Firm Info</th>
                                        <th className="px-6 py-3">Subscription</th>
                                        <th className="px-6 py-3">Staff (Active / Limit)</th>
                                        <th className="px-6 py-3">Clients (Active / Limit)</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFirms.map((firm) => (
                                        <tr key={firm.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{firm.name}</div>
                                                <div className="text-xs text-gray-500">{firm.email}</div>
                                                <div className="text-xs text-gray-500">{firm.contact_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${firm.subscription_tier === 'growth' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {firm.subscription_tier}
                                                    </span>
                                                    <span className={`text-xs capitalize ${firm.subscription_status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                                                        {firm.subscription_status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        {firm.staff_count} / {firm.custom_user_limit || (firm.subscription_tier === 'growth' ? '∞' : '5')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        {firm.client_count} / {firm.custom_client_limit || (firm.subscription_tier === 'growth' ? '∞' : '100')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    onClick={() => setSelectedFirm(firm)}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedFirm && (
                <EditFirmModal
                    firm={selectedFirm}
                    isOpen={!!selectedFirm}
                    onClose={() => setSelectedFirm(null)}
                    onSuccess={handleUpdateSuccess}
                />
            )}
        </div>
    );
}
