import React from 'react';

export default function ComparePage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
            <h1 className="text-5xl font-extrabold mb-8">CAControl vs. The Rest</h1>
            <p className="text-xl text-gray-600 mb-16">See why leading firms are switching to our centralized practice management hub.</p>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="py-4 border-b">Feature</th>
                            <th className="py-4 border-b text-brand-primary font-bold">CAControl</th>
                            <th className="py-4 border-b text-gray-400">Spreadsheets</th>
                            <th className="py-4 border-b text-gray-400">Generic Tools</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-4 border-b">Auto Task Generation</td>
                            <td className="py-4 border-b text-green-500 font-bold">✓ Included</td>
                            <td className="py-4 border-b text-red-500">✕ Manual</td>
                            <td className="py-4 border-b text-red-500">✕ Missing</td>
                        </tr>
                        <tr>
                            <td className="py-4 border-b">Role-Based Access</td>
                            <td className="py-4 border-b text-green-500 font-bold">✓ Secure</td>
                            <td className="py-4 border-b text-red-500">✕ Risky</td>
                            <td className="py-4 border-b text-yellow-500">Limited</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-20 text-center">
                <a href="/pricing" className="bg-brand-primary text-white px-10 py-4 rounded-xl font-bold inline-block hover:bg-orange-600 transition-all">Start Free Trial</a>
            </div>
        </div>
    );
}
