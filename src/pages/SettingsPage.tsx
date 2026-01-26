import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settings.store';
import { Save, Building2, FileText, Check, CreditCard, Zap } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { SubscriptionService } from '../services/subscription.service';
import { authService } from '../services/auth.service';

const LimitCard = ({ label, limit, icon }: { label: string, limit: number, icon: React.ReactNode }) => (
    <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                {icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-900">
            {limit === Infinity ? 'Unlimited' : limit}
        </span>
    </div>
);

const SettingsPage: React.FC = () => {
    const { firm: settingsFirm, fetchFirmProfile, updateFirmProfile, isLoading } = useSettingsStore();
    const { firm: authFirm, setFirm } = useAuthStore();
    const navigate = useNavigate();

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
        if (settingsFirm) {
            setName(settingsFirm.name || '');
            setEmail(settingsFirm.email || '');
            setPhone(settingsFirm.contact_number || '');
            setWebsite(settingsFirm.website || '');
            setAddress(settingsFirm.address || '');
            setGstin(settingsFirm.gstin || '');
            setPan(settingsFirm.pan || '');
            setPrefix(settingsFirm.invoice_prefix || 'INV-');
            setSequence(settingsFirm.invoice_sequence || 1);
            setTheme(settingsFirm.invoice_theme || 'modern');
        }
    }, [settingsFirm]);

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

                {/* Subscription Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-2 mb-6">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <h2 className="text-lg font-bold text-gray-900">Subscription & Limits</h2>
                    </div>

                    <div className={`${authFirm?.subscription_tier === 'growth' ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'} border rounded-xl p-6`}>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <div className="flex items-center space-x-3">
                                    <h3 className="text-xl font-bold text-gray-900 capitalize">
                                        {authFirm?.subscription_tier || 'Free'} Tier
                                    </h3>
                                    {authFirm?.subscription_tier === 'growth' && (
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {authFirm?.subscription_tier === 'growth'
                                        ? 'Enjoy expanded limits and premium features.'
                                        : 'Basic features for small firms. Upgrade to remove limits.'}
                                </p>
                            </div>


                            {authFirm?.subscription_tier !== 'growth' ? (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard/upgrade')}
                                    className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center"
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Upgrade to Growth (₹999/mo)
                                </button>
                            ) : (
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${authFirm?.subscription_status === 'cancelled'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {authFirm?.subscription_status === 'cancelled' ? 'Cancelling' : 'Active'}
                                        </span>
                                    </div>

                                    {authFirm?.subscription_status === 'active' && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to cancel? You will retain access until the end of your billing period.')) {
                                                    try {
                                                        if (authFirm?.id) {
                                                            await SubscriptionService.cancelSubscription(authFirm.id);
                                                            const updatedFirm = await authService.getFirm(authFirm.id);
                                                            setFirm(updatedFirm);
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert('Cancellation failed.');
                                                    }
                                                }
                                            }}
                                            className="text-xs text-red-600 hover:text-red-700 underline"
                                        >
                                            Cancel Subscription
                                        </button>
                                    )}

                                    {authFirm?.subscription_status === 'cancelled' && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (confirm('Resume your Growth subscription?')) {
                                                    try {
                                                        if (authFirm?.id) {
                                                            await SubscriptionService.resumeSubscription(authFirm.id);
                                                            const updatedFirm = await authService.getFirm(authFirm.id);
                                                            setFirm(updatedFirm);
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert('Resuming failed.');
                                                    }
                                                }
                                            }}
                                            className="text-xs text-green-600 hover:text-green-700 font-bold underline"
                                        >
                                            Resume Subscription
                                        </button>
                                    )}

                                    {authFirm?.subscription_end_date && (
                                        <p className="text-xs text-gray-500">
                                            Access until: {new Date(authFirm.subscription_end_date).toLocaleDateString()}
                                        </p>
                                    )}

                                    {!authFirm?.subscription_end_date && (
                                        <p className="text-xs text-indigo-600 font-medium">Next billing date:
                                            {authFirm?.subscription_updated_at
                                                ? new Date(new Date(authFirm.subscription_updated_at).setMonth(new Date(authFirm.subscription_updated_at).getMonth() + 1)).toLocaleDateString()
                                                : new Date().toLocaleDateString()
                                            }
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <LimitCard
                                label="Users"
                                limit={SubscriptionService.getLimits(authFirm).maxUsers}
                                icon={<Building2 className="h-4 w-4" />}
                            />
                            <LimitCard
                                label="Clients"
                                limit={SubscriptionService.getLimits(authFirm).maxClients}
                                icon={<Building2 className="h-4 w-4" />}
                            />
                            <LimitCard
                                label="Audits / Month"
                                limit={SubscriptionService.getLimits(authFirm).maxAuditsPerMonth}
                                icon={<Check className="h-4 w-4" />}
                            />
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
