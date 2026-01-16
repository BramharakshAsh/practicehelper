import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settings.store';
import { Save, Building2, FileText, Check } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { firm, fetchFirmProfile, updateFirmProfile, isLoading } = useSettingsStore();

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [address, setAddress] = useState('');
    const [gstin, setGstin] = useState('');
    const [pan, setPan] = useState('');

    // Invoice Settings
    const [prefix, setPrefix] = useState('INV-');
    const [sequence, setSequence] = useState(1);
    const [theme, setTheme] = useState<'classic' | 'modern' | 'minimal'>('modern');

    useEffect(() => {
        fetchFirmProfile();
    }, [fetchFirmProfile]);

    useEffect(() => {
        if (firm) {
            setName(firm.name || '');
            setEmail(firm.email || '');
            setPhone(firm.contact_number || '');
            setWebsite(firm.website || '');
            setAddress(firm.address || '');
            setGstin(firm.gstin || '');
            setPan(firm.pan || '');
            setPrefix(firm.invoice_prefix || 'INV-');
            setSequence(firm.invoice_sequence || 1);
            setTheme(firm.invoice_theme || 'modern');
        }
    }, [firm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateFirmProfile({
                name,
                email,
                contact_number: phone,
                website,
                address,
                gstin,
                pan,
                invoice_prefix: prefix,
                invoice_sequence: sequence,
                invoice_theme: theme
            });
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Failed to save settings.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <h1 className="text-2xl font-bold text-gray-900">Firm Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Firm Profile Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-2 mb-6">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Firm Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                            <input
                                type="text"
                                value={gstin}
                                onChange={(e) => setGstin(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                            <input
                                type="text"
                                value={pan}
                                onChange={(e) => setPan(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Settings Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-2 mb-6">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Invoice Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                            <input
                                type="text"
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                                placeholder="INV-"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Next Sequence Number</label>
                            <input
                                type="number"
                                value={sequence}
                                onChange={(e) => setSequence(parseInt(e.target.value))}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Next invoice will be: {prefix}{sequence}</p>
                        </div>
                    </div>

                    {/* Visual Themes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Invoice Template Theme</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Modern Theme Card */}
                            <div
                                onClick={() => setTheme('modern')}
                                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${theme === 'modern' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="h-32 bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden relative">
                                    <div className="h-8 bg-blue-600 w-full mb-2"></div>
                                    <div className="px-2 space-y-1">
                                        <div className="h-2 w-1/3 bg-gray-200 rounded"></div>
                                        <div className="h-2 w-1/4 bg-gray-100 rounded"></div>
                                        <div className="h-10 w-full border border-gray-100 mt-2 rounded flex items-center justify-center text-[8px] text-gray-400">Items Table</div>
                                    </div>
                                    {theme === 'modern' && (
                                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 text-center">Modern</h3>
                                <p className="text-xs text-gray-500 text-center">Professional header, clean layout.</p>
                            </div>

                            {/* Classic Theme Card */}
                            <div
                                onClick={() => setTheme('classic')}
                                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${theme === 'classic' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="h-32 bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden relative p-2">
                                    <div className="flex justify-between mb-2">
                                        <div className="h-4 w-10 bg-gray-300 rounded"></div>
                                        <div className="h-4 w-10 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-1 w-full bg-gray-300 mb-2"></div>
                                    <div className="h-10 w-full border border-gray-300 mt-2 flex items-center justify-center text-[8px] text-gray-400">Grid Table</div>
                                    {theme === 'classic' && (
                                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 text-center">Classic</h3>
                                <p className="text-xs text-gray-500 text-center">Traditional grid lines, formal look.</p>
                            </div>

                            {/* Minimal Theme Card */}
                            <div
                                onClick={() => setTheme('minimal')}
                                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${theme === 'minimal' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="h-32 bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden relative p-3">
                                    <div className="h-4 w-10 bg-gray-800 rounded mb-4"></div>
                                    <div className="h-2 w-full bg-gray-100 rounded mb-1"></div>
                                    <div className="h-2 w-full bg-gray-100 rounded mb-1"></div>
                                    {theme === 'minimal' && (
                                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 text-center">Minimal</h3>
                                <p className="text-xs text-gray-500 text-center">Simple, lots of whitespace.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
