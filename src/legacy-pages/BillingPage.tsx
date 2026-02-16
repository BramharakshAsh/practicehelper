import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import InvoiceList from '../components/Billing/InvoiceList';
import CreateInvoiceModal from '../components/Billing/CreateInvoiceModal';

const BillingPage: React.FC = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
                    <p className="text-gray-500">Manage invoices and track payments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Invoice
                </button>
            </div>

            <InvoiceList />

            {showCreateModal && (
                <CreateInvoiceModal onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    );
};

export default BillingPage;
