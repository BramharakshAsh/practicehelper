import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Audit Templates",
    description: "Download and use our professionally designed audit templates and checklists for your CA practice.",
};

export default function TemplatesPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32">
            <h1 className="text-5xl font-extrabold mb-8">Document Templates</h1>
            <p className="text-xl text-gray-600 mb-12">Free templates to help you run your CA practice more efficiently.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="text-2xl font-bold mb-4">Engagement Letter</h3>
                    <p className="text-gray-600 mb-6">A standard engagement letter template for audit and tax services.</p>
                    <button className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold opacity-50 cursor-not-allowed">Download Word</button>
                </div>
                <div className="p-8 bg-white rounded-2xl border-2 border-brand-primary">
                    <h3 className="text-2xl font-bold mb-4">Client Onboarding Checklist</h3>
                    <p className="text-gray-600 mb-6">Ensure no document is missed during the initial onboarding phase.</p>
                    <button className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold opacity-50 cursor-not-allowed">Download PDF</button>
                </div>
            </div>

            <div className="mt-20">
                <a href="/" className="text-brand-primary font-bold hover:underline">Back to Home</a>
            </div>
        </div>
    );
}
