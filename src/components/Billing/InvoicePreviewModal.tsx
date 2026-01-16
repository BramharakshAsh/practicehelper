import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Settings } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Invoice, Firm } from '../../types';
import { useSettingsStore } from '../../store/settings.store';
import { InvoiceThemeModern, InvoiceThemeClassic, InvoiceThemeMinimal } from './InvoiceThemes';

interface InvoicePreviewModalProps {
    invoice: Invoice;
    onClose: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ invoice, onClose }) => {
    const { firm, fetchFirmProfile } = useSettingsStore();
    const [activeTheme, setActiveTheme] = useState<'modern' | 'classic' | 'minimal'>('modern');
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchFirmProfile();
    }, [fetchFirmProfile]);

    useEffect(() => {
        if (firm?.invoice_theme) {
            setActiveTheme(firm.invoice_theme);
        }
    }, [firm]);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Invoice-${invoice.invoice_number}`,
    });

    if (!firm) return <div className="p-4">Loading firm details...</div>;

    const renderTheme = () => {
        switch (activeTheme) {
            case 'classic': return <InvoiceThemeClassic invoice={invoice} firm={firm} />;
            case 'minimal': return <InvoiceThemeMinimal invoice={invoice} firm={firm} />;
            default: return <InvoiceThemeModern invoice={invoice} firm={firm} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[300] p-4 overflow-y-auto">
            <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden">

                {/* Sidebar Controls */}
                <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 flex flex-col z-10">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-gray-900">Preview</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Select Theme</label>
                        <div className="space-y-3">
                            <button
                                onClick={() => setActiveTheme('modern')}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${activeTheme === 'modern' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="font-bold block">Modern</span>
                                <span className="text-xs opacity-75">Professional & Clean</span>
                            </button>
                            <button
                                onClick={() => setActiveTheme('classic')}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${activeTheme === 'classic' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="font-bold block">Classic</span>
                                <span className="text-xs opacity-75">Formal & Traditional</span>
                            </button>
                            <button
                                onClick={() => setActiveTheme('minimal')}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${activeTheme === 'minimal' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="font-bold block">Minimal</span>
                                <span className="text-xs opacity-75">Simple & Elegant</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={handlePrint}
                            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            <Printer className="h-5 w-5 mr-2" />
                            Print Invoice
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-gray-500 overflow-y-auto p-8 flex justify-center">
                    <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl scale-90 origin-top">
                        <div ref={componentRef}>
                            {renderTheme()}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InvoicePreviewModal;
