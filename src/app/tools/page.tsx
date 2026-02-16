import React from 'react';

export default function ToolsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32">
            <h1 className="text-5xl font-extrabold mb-8">CA Utilities & Tools</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="text-2xl font-bold mb-4">GST Calculator</h3>
                    <p className="text-gray-600">Quickly calculate GST components for your clients.</p>
                </div>
                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="text-2xl font-bold mb-4">TDS Tracker</h3>
                    <p className="text-gray-600">Monitor TDS filing deadlines and compliance status.</p>
                </div>
            </div>
            <div className="mt-12">
                <a href="/" className="text-brand-primary font-bold hover:underline">Back to Home</a>
            </div>
        </div>
    );
}
