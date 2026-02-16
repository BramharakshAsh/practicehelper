import React from 'react';

export default function CalendarPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32">
            <h1 className="text-5xl font-extrabold mb-8">Compliance Calendar 2026</h1>
            <p className="text-xl text-gray-600 mb-12">Never miss a GST, TDS, or Income Tax deadline again.</p>

            <div className="space-y-6">
                <div className="flex items-center p-6 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-orange-100 rounded-lg flex flex-col items-center justify-center mr-6">
                        <span className="text-xs font-bold text-brand-primary">FEB</span>
                        <span className="text-2xl font-bold text-gray-900">20</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">GSTR-3B Filing</h3>
                        <p className="text-gray-500">Monthly return for regular taxpayers.</p>
                    </div>
                </div>
                <div className="flex items-center p-6 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center mr-6">
                        <span className="text-xs font-bold text-blue-600">FEB</span>
                        <span className="text-2xl font-bold text-gray-900">28</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Income Tax Audit</h3>
                        <p className="text-gray-500">Final deadline for specific categories.</p>
                    </div>
                </div>
            </div>

            <div className="mt-20">
                <a href="/" className="text-brand-primary font-bold hover:underline">Back to Home</a>
            </div>
        </div>
    );
}
