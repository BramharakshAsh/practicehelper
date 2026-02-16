"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { UniversalLink as Link } from '../Common/UniversalLink';

export const PricingSection: React.FC = () => {
    return (
        <section id="pricing" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent <span className="text-brand-primary">Pricing</span></h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the plan that best fits your practice size and needs. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Tier</h3>
                        <div className="flex items-baseline mb-6">
                            <span className="text-4xl font-extrabold text-gray-900">₹0</span>
                            <span className="text-gray-500 ml-2">/month</span>
                        </div>
                        <p className="text-gray-600 mb-8">Perfect for small firms and individual practitioners getting started.</p>

                        <ul className="space-y-4 mb-8 text-left">
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-600">Up to 5 Users</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-600">Up to 25 Clients</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-600">Auto Task: Once every 3 months</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-600">1 Audit Creation per month</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-600">Excel Import: Once (Lifetime)</span>
                            </li>
                        </ul>

                        <Link
                            to="/login"
                            className="block w-full text-center bg-gray-50 text-gray-900 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Growth Tier */}
                    <div className="bg-white rounded-3xl p-8 border-2 border-brand-primary shadow-xl relative overflow-hidden transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Growth Tier</h3>
                        <div className="flex items-baseline mb-6">
                            <span className="text-4xl font-extrabold text-gray-900">₹999</span>
                            <span className="text-gray-500 ml-2">/month</span>
                        </div>
                        <p className="text-gray-600 mb-8">For growing firms that need more power and fewer limits.</p>

                        <ul className="space-y-4 mb-8 text-left">
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                <span className="text-gray-900 font-medium">Up to 25 Users</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                <span className="text-gray-900 font-medium">Up to 150 Clients</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                <span className="text-gray-900 font-medium">Unlimited Auto Tasks</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                <span className="text-gray-900 font-medium">Unlimited Audit Creations</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                <span className="text-gray-900 font-medium">Unlimited Excel Imports</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                                <span className="text-gray-900 font-medium">Additional users/clients scalable</span>
                            </li>
                        </ul>

                        <Link
                            to="/login"
                            className="block w-full text-center bg-brand-primary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-500/30 hover:bg-orange-600 transition-all"
                        >
                            Upgrade to Growth
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};
