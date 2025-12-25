import * as React from 'react';

const ReportsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                <p className="text-gray-600 mt-1">Comprehensive insights into your practice performance</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600">Advanced reporting and analytics features will be available in the next release.</p>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
