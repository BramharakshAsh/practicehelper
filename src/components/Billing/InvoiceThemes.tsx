import React from 'react';
import { Invoice, Firm } from '../../types';

interface InvoiceThemeProps {
    invoice: Invoice;
    firm: Firm;
}

// Helper to calculate totals
const calculateTotals = (invoice: Invoice) => {
    const services = invoice.items?.filter(i => i.type !== 'reimbursement') || [];
    const reimbursements = invoice.items?.filter(i => i.type === 'reimbursement') || [];

    const serviceSubtotal = services.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const reimbursementTotal = reimbursements.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = invoice.tax_amount || 0;

    return { services, reimbursements, serviceSubtotal, reimbursementTotal, tax };
};

export const InvoiceThemeModern: React.FC<InvoiceThemeProps> = ({ invoice, firm }) => {
    const { services, reimbursements, serviceSubtotal, reimbursementTotal, tax } = calculateTotals(invoice);

    return (
        <div className="font-sans text-gray-800 p-8 max-w-4xl mx-auto bg-white min-h-[1000px]">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-blue-600 mb-2">{invoice.is_gst ? 'TAX INVOICE' : 'INVOICE'}</h1>
                    <p className="text-gray-500 font-medium">#{invoice.invoice_number}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-900">{firm.name}</h2>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{firm.address}</p>
                    <p className="text-sm text-gray-600 mt-1">{firm.email} • {firm.contact_number}</p>
                    {firm.gstin && <p className="text-sm text-gray-600">GSTIN: {firm.gstin}</p>}
                    {firm.pan && <p className="text-sm text-gray-600">PAN: {firm.pan}</p>}
                </div>
            </div>

            {/* Bill To & Details */}
            <div className="flex justify-between mb-12 bg-gray-50 p-6 rounded-xl">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bill To</p>
                    <h3 className="text-lg font-bold text-gray-900">{invoice.client?.name}</h3>
                    <p className="text-sm text-gray-600">{invoice.client?.email}</p>
                    {invoice.client?.address && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{invoice.client.address}</p>}
                    {invoice.client?.gstin && <p className="text-sm text-gray-600">GSTIN: {invoice.client.gstin}</p>}
                </div>
                <div className="text-right">
                    <div className="mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase mr-4">Issue Date</span>
                        <span className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase mr-4">Due Date</span>
                        <span className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead className="border-b-2 border-blue-600">
                    <tr>
                        <th className="py-3 text-left text-sm font-bold text-blue-600 uppercase">Description</th>
                        <th className="py-3 text-right text-sm font-bold text-blue-600 uppercase w-24">Qty</th>
                        <th className="py-3 text-right text-sm font-bold text-blue-600 uppercase w-32">Rate</th>
                        <th className="py-3 text-right text-sm font-bold text-blue-600 uppercase w-32">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {services.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-4 text-sm font-medium">{item.description}</td>
                            <td className="py-4 text-right text-sm text-gray-600">{item.quantity}</td>
                            <td className="py-4 text-right text-sm text-gray-600">₹{item.unit_price.toFixed(2)}</td>
                            <td className="py-4 text-right text-sm font-bold">₹{item.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>₹{serviceSubtotal.toFixed(2)}</span>
                    </div>
                    {invoice.is_gst && (
                        <>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>CGST ({invoice.tax_rate / 2}%)</span>
                                <span>₹{(tax / 2).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>SGST ({invoice.tax_rate / 2}%)</span>
                                <span>₹{(tax / 2).toFixed(2)}</span>
                            </div>
                        </>
                    )}

                    {reimbursementTotal > 0 && (
                        <>
                            <div className="my-2 border-t border-dashed border-gray-300"></div>
                            <div className="flex justify-between text-sm text-amber-700 font-medium">
                                <span>Reimbursements</span>
                                <span>₹{reimbursementTotal.toFixed(2)}</span>
                            </div>
                            {reimbursements.map((r, i) => (
                                <div key={i} className="flex justify-between text-xs text-amber-600 pl-4">
                                    <span className="truncate w-32">{r.description}</span>
                                    <span>₹{r.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </>
                    )}

                    <div className="flex justify-between text-xl font-bold text-blue-600 border-t-2 border-blue-600 pt-4 mt-4">
                        <span>Total</span>
                        <span>₹{invoice.total_amount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {(invoice.notes || invoice.terms) && (
                <div className="border-t border-gray-100 pt-8 grid grid-cols-2 gap-8">
                    {invoice.notes && (
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Notes</h4>
                            <p className="text-sm text-gray-600">{invoice.notes}</p>
                        </div>
                    )}
                    {invoice.terms && (
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
                            <p className="text-sm text-gray-600">{invoice.terms}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const InvoiceThemeClassic: React.FC<InvoiceThemeProps> = ({ invoice, firm }) => {
    const { services, reimbursements, serviceSubtotal, reimbursementTotal, tax } = calculateTotals(invoice);

    return (
        <div className="font-serif text-gray-900 p-8 max-w-4xl mx-auto bg-white min-h-[1000px]">
            {/* Header */}
            <div className="text-center mb-10 pb-6 border-b border-gray-300">
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{firm.name}</h1>
                <p className="text-sm">{firm.address}</p>
                <div className="flex justify-center space-x-4 text-sm mt-1">
                    <span>{firm.email}</span>
                    <span>|</span>
                    <span>{firm.contact_number}</span>
                </div>
                {firm.gstin && <p className="text-sm mt-1 font-bold">GSTIN: {firm.gstin}</p>}
            </div>

            <div className="flex justify-between mb-8">
                <div className="border border-gray-300 p-4 w-5/12">
                    <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 block">BILL TO:</h3>
                    <p className="font-bold">{invoice.client?.name}</p>
                    <p className="text-sm">{invoice.client?.email}</p>
                </div>
                <div className="w-5/12 text-right">
                    <h2 className="text-2xl font-bold mb-4">INVOICE</h2>
                    <table className="w-full text-right text-sm">
                        <tbody>
                            <tr><td className="font-bold pr-4">Invoice No:</td><td>{invoice.invoice_number}</td></tr>
                            <tr><td className="font-bold pr-4">Date:</td><td>{new Date(invoice.issue_date).toLocaleDateString()}</td></tr>
                            <tr><td className="font-bold pr-4">Due Date:</td><td>{new Date(invoice.due_date).toLocaleDateString()}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <table className="w-full border-collapse border border-gray-300 mb-8">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border border-gray-300 py-2 px-3 text-left">Description</th>
                        <th className="border border-gray-300 py-2 px-3 text-right w-20">Qty</th>
                        <th className="border border-gray-300 py-2 px-3 text-right w-28">Rate</th>
                        <th className="border border-gray-300 py-2 px-3 text-right w-28">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((item, idx) => (
                        <tr key={idx}>
                            <td className="border border-gray-300 py-2 px-3">{item.description}</td>
                            <td className="border border-gray-300 py-2 px-3 text-right">{item.quantity}</td>
                            <td className="border border-gray-300 py-2 px-3 text-right">{item.unit_price.toFixed(2)}</td>
                            <td className="border border-gray-300 py-2 px-3 text-right">{item.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                    {/* Filler rows for visual balance if needed */}
                </tbody>
            </table>

            <div className="flex justify-end">
                <table className="w-64 border-collapse">
                    <tbody>
                        <tr>
                            <td className="py-1 text-right pr-4 font-bold">Subtotal:</td>
                            <td className="py-1 text-right">₹{serviceSubtotal.toFixed(2)}</td>
                        </tr>
                        {invoice.is_gst && (
                            <>
                                <tr>
                                    <td className="py-1 text-right pr-4">CGST:</td>
                                    <td className="py-1 text-right">₹{(tax / 2).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 text-right pr-4">SGST:</td>
                                    <td className="py-1 text-right">₹{(tax / 2).toFixed(2)}</td>
                                </tr>
                            </>
                        )}
                        {reimbursementTotal > 0 && (
                            <>
                                <tr><td colSpan={2} className="py-1 border-b border-gray-300"></td></tr>
                                <tr>
                                    <td className="py-1 text-right pr-4 font-medium">Reimbursements:</td>
                                    <td className="py-1 text-right">₹{reimbursementTotal.toFixed(2)}</td>
                                </tr>
                            </>
                        )}
                        <tr>
                            <td className="py-2 text-right pr-4 font-bold border-t border-gray-800 text-lg">TOTAL:</td>
                            <td className="py-2 text-right font-bold border-t border-gray-800 text-lg">₹{invoice.total_amount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-12 text-sm">
                {invoice.notes && <div className="mb-4"><strong>Notes:</strong> {invoice.notes}</div>}
                {invoice.terms && <div><strong>Terms:</strong> {invoice.terms}</div>}
            </div>
        </div>
    );
};

export const InvoiceThemeMinimal: React.FC<InvoiceThemeProps> = ({ invoice, firm }) => {
    const { services, reimbursements, serviceSubtotal, reimbursementTotal, tax } = calculateTotals(invoice);

    return (
        <div className="font-sans text-gray-800 p-12 max-w-4xl mx-auto bg-white min-h-[1000px]">
            <div className="mb-16">
                <h1 className="text-5xl font-light text-gray-900 mb-8 tracking-tight">{firm.name}</h1>
                <div className="text-sm text-gray-500 space-y-1">
                    <p>{firm.address}</p>
                    <p>{firm.gstin && `GSTIN: ${firm.gstin}`}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-16">
                <div>
                    <p className="text-gray-400 text-sm mb-1">Billed To</p>
                    <p className="font-medium text-lg">{invoice.client?.name}</p>
                </div>
                <div className="flex justify-between">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Invoice No</p>
                        <p className="font-medium">{invoice.invoice_number}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Issue Date</p>
                        <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Amount Due</p>
                        <p className="font-medium">₹{invoice.balance_amount.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <table className="w-full mb-12">
                <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-left font-normal py-2">Item</th>
                        <th className="text-right font-normal py-2">Qty</th>
                        <th className="text-right font-normal py-2">Price</th>
                        <th className="text-right font-normal py-2">Total</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {services.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                            <td className="py-4 font-medium">{item.description}</td>
                            <td className="py-4 text-right text-gray-500">{item.quantity}</td>
                            <td className="py-4 text-right text-gray-500">{item.unit_price.toFixed(2)}</td>
                            <td className="py-4 text-right">{item.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                    {reimbursements.map((item, idx) => (
                        <tr key={`r-${idx}`} className="border-b border-gray-50 bg-gray-50/50">
                            <td className="py-4 font-medium text-gray-600">{item.description} <span className="text-[10px] uppercase bg-gray-200 px-1 rounded ml-2">Reimb.</span></td>
                            <td className="py-4 text-right text-gray-500">{item.quantity}</td>
                            <td className="py-4 text-right text-gray-500">{item.unit_price.toFixed(2)}</td>
                            <td className="py-4 text-right text-gray-600">{item.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-16">
                <div className="w-1/3 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>₹{serviceSubtotal.toFixed(2)}</span>
                    </div>
                    {invoice.is_gst && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tax (18%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                    )}
                    {reimbursementTotal > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Reimbursements</span>
                            <span>₹{reimbursementTotal.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-4 text-xl font-light border-t border-gray-100 mt-4">
                        <span>Total</span>
                        <span>₹{invoice.total_amount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-400 mt-auto pt-8 border-t border-gray-50">
                <p>{invoice.terms}</p>
            </div>
        </div>
    );
};
