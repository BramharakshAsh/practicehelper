import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService, RegisterOrganizationData } from '../../services/auth.service';

interface RegisterOrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RegisterOrganizationModal: React.FC<RegisterOrganizationModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState<RegisterOrganizationData>({
        firmName: '',
        pan: '',
        email: '',
        contactNumber: '',
        primaryPartner: {
            fullName: '',
            username: '',
            email: '',
            password: '',
        },
    });

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('partner_')) {
            const field = name.replace('partner_', '');
            setFormData(prev => ({
                ...prev,
                primaryPartner: { ...prev.primaryPartner, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 2) {
            setStep(step + 1);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await authService.registerOrganization(formData);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to register organization');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                        <Building2 className="h-6 w-6" />
                        <h2 className="text-xl font-bold font-outfit">Register Your Firm</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8">
                    {isSuccess ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
                            <p className="text-gray-600 mb-6">
                                Your organization has been created. You can now log in with your partner credentials.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                                Go to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className={`flex flex-col items-center space-y-1 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>1</div>
                                    <span className="text-xs font-semibold">Firm Details</span>
                                </div>
                                <div className="h-px bg-gray-200 flex-1 mx-4 mt-[-20px]"></div>
                                <div className={`flex flex-col items-center space-y-1 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>2</div>
                                    <span className="text-xs font-semibold">Partner Account</span>
                                </div>
                            </div>

                            {step === 1 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Firm Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="firmName"
                                                required
                                                value={formData.firmName}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                placeholder="e.g. Sharma & Associates"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700">PAN</label>
                                            <input
                                                type="text"
                                                name="pan"
                                                required
                                                value={formData.pan}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none uppercase"
                                                placeholder="ABCDE1234F"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700">Contact Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    name="contactNumber"
                                                    required
                                                    value={formData.contactNumber}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                    placeholder="9999999999"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Official Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                placeholder="office@sharmaassociates.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="partner_fullName"
                                                required
                                                value={formData.primaryPartner.fullName}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                placeholder="Rajesh Sharma"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700">Username</label>
                                            <input
                                                type="text"
                                                name="partner_username"
                                                required
                                                value={formData.primaryPartner.username}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                placeholder="rajesh_sharma"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700">Partner Email</label>
                                            <input
                                                type="email"
                                                name="partner_email"
                                                required
                                                value={formData.primaryPartner.email}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                placeholder="rajesh@sharma.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                type="password"
                                                name="partner_password"
                                                required
                                                value={formData.primaryPartner.password}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="mt-8 flex items-center space-x-4">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(step - 1)}
                                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                        <span>Back</span>
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-[2] bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center space-x-2 disabled:opacity-50`}
                                >
                                    {isLoading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>{step === 1 ? 'Continue' : 'Complete Registration'}</span>
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterOrganizationModal;
