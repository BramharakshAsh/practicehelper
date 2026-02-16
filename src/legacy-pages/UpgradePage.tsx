import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';

const UpgradePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <button
                onClick={() => navigate('/dashboard/settings')}
                className="flex items-center text-gray-500 hover:text-gray-700 mb-8 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-12 text-center text-white">
                    <h1 className="text-3xl font-bold mb-4">Upgrade to Growth Tier</h1>
                    <p className="text-orange-50 text-lg max-w-2xl mx-auto">
                        Unlock the full potential of your practice with unlimited audits, auto-tasks, and more clients.
                    </p>
                </div>

                <div className="p-8 md:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Benefits Column */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Why Upgrade?</h2>
                            <ul className="space-y-4">
                                {[
                                    'Unlimited Audit Creations',
                                    'Unlimited Auto Task Generation',
                                    'Manage up to 150 Clients',
                                    'Add up to 25 Staff Members',
                                    'Unlimited Excel Imports',
                                    'Priority Support'
                                ].map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                                        <span className="text-gray-700">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Column */}
                        <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Contact to Upgrade</h2>
                            <p className="text-gray-600 mb-8 text-sm">
                                We are currently manually processing upgrades. Please contact our support team to activate your Growth plan instantly.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div className="bg-blue-50 p-3 rounded-full mr-4">
                                        <Mail className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Email Us</p>
                                        <a href="mailto:learnwithfun116@gmail.com" className="text-lg font-semibold text-gray-900 hover:text-brand-primary">
                                            learnwithfun116@gmail.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div className="bg-green-50 p-3 rounded-full mr-4">
                                        <Phone className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Call / WhatsApp</p>
                                        <a href="tel:+91 87962 00809" className="text-lg font-semibold text-gray-900 hover:text-brand-primary">
                                            +91 87962 00809
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <p className="text-xs text-gray-500 text-center">
                                    Payment gateways (Razorpay/PhonePe) integration coming soon.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradePage;
