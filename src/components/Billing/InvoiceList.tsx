import React, { useEffect, useState } from 'react';
import { Eye, Trash2, CheckCircle, Send, MoreVertical, X } from 'lucide-react';
import { useBillingStore } from '../../store/billing.store';
import { useClientsStore } from '../../store/clients.store';
import { Invoice } from '../../types';
import InvoicePreviewModal from './InvoicePreviewModal';

const InvoiceList: React.FC = () => {
    const { invoices, fetchInvoices, isLoading, deleteInvoice, markAsSent, markAsPaid } = useBillingStore();
    const { clients, fetchClients } = useClientsStore();
    const [selectedClient, setSelectedClient] = useState<string>('');

    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        fetchInvoices();
        fetchClients();
    }, [fetchInvoices, fetchClients]);

    useEffect(() => {
        fetchInvoices(selectedClient || undefined);
    }, [selectedClient, fetchInvoices]);

    const getStatusBadge = (status: string) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-800',
            sent: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            void: 'bg-gray-100 text-gray-400'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${(styles as any)[status]}`}>{status}</span>;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Invoices</h2>
                <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="text-sm border-gray-300 rounded-lg focus:ring-blue-500"
                >
                    <option value="">All Clients</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading invoices...</div>
                ) : invoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No invoices found.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.client?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                                        ₹{invoice.total_amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setPreviewInvoice(invoice)} className="text-gray-400 hover:text-blue-600 transition-colors" title="View/Print">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => markAsSent(invoice.id)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Mark Sent">
                                            <Send className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => markAsPaid(invoice.id)} className="text-gray-400 hover:text-green-600 transition-colors" title="Mark Paid">
                                            <CheckCircle className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => deleteInvoice(invoice.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {previewInvoice && (
                <InvoicePreviewModal
                    invoice={previewInvoice}
                    onClose={() => setPreviewInvoice(null)}
                />
            )}
        </div>
    );
};

export default InvoiceList;
