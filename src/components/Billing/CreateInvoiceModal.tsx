import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Calendar, Save, FileText } from 'lucide-react';
import { useBillingStore } from '../../store/billing.store';
import { useClientsStore } from '../../store/clients.store';
import { TimeEntry, InvoiceTemplate } from '../../types';

interface CreateInvoiceModalProps {
    onClose: () => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ onClose }) => {
    const { createInvoice, getBillableTime, fetchTemplates, createTemplate, templates, isLoading: isSubmitting } = useBillingStore();
    const { clients, fetchClients } = useClientsStore();

    const [clientId, setClientId] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('Payment due within 15 days.');
    const [isGst, setIsGst] = useState(true);
    const [gstType, setGstType] = useState<'intra' | 'inter'>('intra');

    const [items, setItems] = useState<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        type: 'service' | 'reimbursement';
        timeEntryId?: string;
    }[]>([
        { id: '1', description: 'Professional Services', quantity: 1, unitPrice: 0, type: 'service' }
    ]);

    const [availableTimeEntries, setAvailableTimeEntries] = useState<TimeEntry[]>([]);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Template State
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');

    useEffect(() => {
        fetchClients();
        fetchTemplates();
    }, [fetchClients, fetchTemplates]);

    useEffect(() => {
        if (clientId) {
            loadBillableITime(clientId);
        } else {
            setAvailableTimeEntries([]);
        }
    }, [clientId]);

    const loadBillableITime = async (cid: string) => {
        const entries = await getBillableTime(cid);
        setAvailableTimeEntries(entries);
    };

    const handleAddItem = (type: 'service' | 'reimbursement' = 'service') => {
        setItems([...items, { id: Date.now().toString(), description: type === 'reimbursement' ? 'Reimbursement: ' : '', quantity: 1, unitPrice: 0, type }]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleAddTimeEntries = (selectedIds: string[]) => {
        const newItems = selectedIds.map(id => {
            const entry = availableTimeEntries.find(e => e.id === id);
            if (!entry) return null;

            const hours = entry.duration_minutes ? +(entry.duration_minutes / 60).toFixed(2) : 0;

            return {
                id: `time-${entry.id}`,
                description: `Time: ${(entry as any).task?.title || 'Task'} (${new Date(entry.started_at).toLocaleDateString()})`,
                quantity: hours,
                unitPrice: entry.billing_rate || 0,
                type: 'service' as const,
                timeEntryId: entry.id
            };
        }).filter(Boolean) as any[];

        setItems([...items, ...newItems]);
        setShowTimePicker(false);
    };

    const loadTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        if (window.confirm('Load template? This will replace current items and settings.')) {
            setItems(template.items.map((i, idx) => ({ ...i, id: `tmpl-${idx}`, timeEntryId: undefined })));
            setTerms(template.terms || '');
            setNotes(template.notes || '');
            setIsGst(template.is_gst);
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateName) return alert('Enter template name');
        try {
            await createTemplate({
                name: templateName,
                items: items.map(i => ({ description: i.description, unit_price: i.unitPrice, type: i.type })),
                terms,
                notes,
                is_gst: isGst
            });
            setShowSaveTemplate(false);
            setTemplateName('');
            alert('Template saved!');
        } catch (error) {
            alert('Failed to save template');
        }
    };

    const calculateTotals = () => {
        const services = items.filter(i => i.type === 'service');
        const reimbursements = items.filter(i => i.type === 'reimbursement');

        const serviceSubtotal = services.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const reimbursementSubtotal = reimbursements.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        const tax = isGst ? serviceSubtotal * 0.18 : 0;
        const total = serviceSubtotal + tax + reimbursementSubtotal;

        return { serviceSubtotal, reimbursementSubtotal, tax, total };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) return alert('Please select a client');
        if (items.length === 0) return alert('Please add at least one item');

        try {
            await createInvoice({
                clientId,
                issueDate,
                dueDate,
                items: items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    type: i.type,
                    timeEntryId: i.timeEntryId
                })),
                notes,
                terms,
                isGst,
                gstType: isGst ? gstType : undefined
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create invoice');
        }
    };

    const totals = calculateTotals();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>

                    <div className="flex items-center space-x-4">
                        <select
                            onChange={(e) => loadTemplate(e.target.value)}
                            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500"
                            defaultValue=""
                        >
                            <option value="" disabled>Load Template...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select Client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                            <input
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col pb-2">
                            <label className="flex items-center space-x-2 cursor-pointer mb-2">
                                <input
                                    type="checkbox"
                                    checked={isGst}
                                    onChange={(e) => setIsGst(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
                                />
                                <span className="text-gray-900 font-bold">Charge GST (18%)</span>
                            </label>
                            {isGst && (
                                <div className="ml-7 flex space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gstType"
                                            value="intra"
                                            checked={gstType === 'intra'}
                                            onChange={() => setGstType('intra')}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">CGST + SGST</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gstType"
                                            value="inter"
                                            checked={gstType === 'inter'}
                                            onChange={() => setGstType('inter')}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">IGST</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Time Picker Toggle */}
                    {clientId && availableTimeEntries.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                            <div className="flex items-center text-blue-800">
                                <Clock className="h-5 w-5 mr-2" />
                                <span className="font-medium">{availableTimeEntries.length} Unbilled Time Entries available</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTimePicker(!showTimePicker)}
                                className="text-sm font-bold text-blue-600 hover:text-blue-800 underline"
                            >
                                {showTimePicker ? 'Hide Time Entries' : 'Review & Add Time'}
                            </button>
                        </div>
                    )}

                    {/* Time Picker Section */}
                    {showTimePicker && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                            {/* ... same as before ... */}
                            <div className="space-y-2">
                                {availableTimeEntries.map(entry => {
                                    const isAdded = items.some(i => i.timeEntryId === entry.id);
                                    if (isAdded) return null;
                                    return (
                                        <div key={entry.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) handleAddTimeEntries([entry.id]);
                                                    }}
                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{(entry as any).task?.title || 'Unknown Task'}</p>
                                                    <p className="text-xs text-gray-500">{new Date(entry.started_at).toLocaleDateString()} • {entry.duration_minutes} mins</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-mono text-gray-600">
                                                {entry.billing_rate ? `Rate: ₹${entry.billing_rate}/hr` : 'No Rate'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-gray-900">Line Items</h3>
                            <div className="space-x-2">
                                <button
                                    type="button"
                                    onClick={() => handleAddItem('service')}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    + Add Service
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddItem('reimbursement')}
                                    className="text-sm font-medium text-amber-600 hover:text-amber-700"
                                >
                                    + Add Reimbursement
                                </button>
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">Rate</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">Amount</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item) => (
                                        <tr key={item.id} className={item.type === 'reimbursement' ? 'bg-amber-50/50' : ''}>
                                            <td className="px-4 py-2">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${item.type === 'reimbursement' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.type === 'reimbursement' ? 'Reimb.' : 'Service'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    className="w-full border-0 p-0 text-sm focus:ring-0 bg-transparent placeholder-gray-400"
                                                    placeholder="Description"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                    className="w-full border-0 p-0 text-sm text-right focus:ring-0 bg-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                                                    className="w-full border-0 p-0 text-sm text-right focus:ring-0 bg-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right text-sm font-mono text-gray-900">
                                                ₹{(item.quantity * item.unitPrice).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals, Notes & Save Template */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                                    placeholder="Notes..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
                                <textarea
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                                    placeholder="Payment terms..."
                                />
                            </div>

                            {/* Save Template UI */}
                            <div className="pt-4 border-t border-gray-100">
                                {showSaveTemplate ? (
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            placeholder="Template Name (e.g. Monthly Standard)"
                                            className="flex-1 text-sm rounded-lg border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveTemplate}
                                            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowSaveTemplate(false)}
                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowSaveTemplate(true)}
                                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-2" /> Save as Template
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 bg-gray-50 p-6 rounded-xl h-fit">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Service Subtotal</span>
                                <span>₹{totals.serviceSubtotal.toFixed(2)}</span>
                            </div>
                            {isGst && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>GST (18%)</span>
                                    <span>₹{totals.tax.toFixed(2)}</span>
                                </div>
                            )}
                            {totals.reimbursementSubtotal > 0 && (
                                <div className="flex justify-between text-sm text-amber-700 font-medium">
                                    <span>Reimbursements (Non-Taxable)</span>
                                    <span>₹{totals.reimbursementSubtotal.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                                <span>Total Payable</span>
                                <span>₹{totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Create Invoice</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateInvoiceModal;
