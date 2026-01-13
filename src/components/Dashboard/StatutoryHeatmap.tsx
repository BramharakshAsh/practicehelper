import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, ComplianceType } from '../../types';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface StatutoryHeatmapProps {
    tasks: Task[];
    complianceTypes: ComplianceType[];
}

const StatutoryHeatmap: React.FC<StatutoryHeatmapProps> = ({ tasks, complianceTypes }) => {
    const navigate = useNavigate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fixed categories as per requirement
    const categories = ['GST', 'TDS', 'Income Tax', 'Audit'];

    // Calculate status for each category
    const getCategoryStatus = (category: string) => {
        // Get all compliance types for this category
        const categoryTypeIds = complianceTypes
            .filter(ct => ct.category === category)
            .map(ct => ct.id);

        // Filter tasks for this category
        const categoryTasks = tasks.filter(t =>
            t.status !== 'filed_completed' &&
            categoryTypeIds.includes(t.compliance_type_id)
        );

        // Check overdue
        const overdueCount = categoryTasks.filter(t => {
            const d = new Date(t.due_date);
            const dueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            return dueDate < today;
        }).length;

        // Check due this week
        const dueThisWeekCount = categoryTasks.filter(t => {
            const d = new Date(t.due_date);
            const dueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        }).length;

        return { overdueCount, dueThisWeekCount };
    };

    const handleCategoryClick = (category: string) => {
        // Navigate with filter
        navigate(`/dashboard/tasks?category=${category}`);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statutory Deadlines Overview</h3>

            <div className="space-y-3">
                {categories.map(category => {
                    const { overdueCount, dueThisWeekCount } = getCategoryStatus(category);

                    let statusContent;
                    let bgColor;
                    let borderColor;

                    if (overdueCount > 0) {
                        // Red state
                        bgColor = 'bg-red-50';
                        borderColor = 'border-red-100';
                        statusContent = (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center text-red-700 font-medium">
                                    <AlertCircle className="h-4 w-4 mr-1.5" />
                                    <span>{overdueCount} OVERDUE</span>
                                </div>
                                {dueThisWeekCount > 0 && (
                                    <div className="text-gray-600 text-sm">
                                        {dueThisWeekCount} Due this week
                                    </div>
                                )}
                            </div>
                        );
                    } else if (dueThisWeekCount > 0) {
                        // Orange state
                        bgColor = 'bg-orange-50';
                        borderColor = 'border-orange-100';
                        statusContent = (
                            <div className="flex items-center text-orange-700 font-medium">
                                <Clock className="h-4 w-4 mr-1.5" />
                                <span>{dueThisWeekCount} Due this week</span>
                            </div>
                        );
                    } else {
                        // Green state
                        bgColor = 'bg-green-50';
                        borderColor = 'border-green-100';
                        statusContent = (
                            <div className="flex items-center text-green-700 font-medium">
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                <span>All clear</span>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={category}
                            onClick={() => handleCategoryClick(category)}
                            className={`flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg border ${bgColor} ${borderColor} cursor-pointer hover:shadow-sm transition-all space-y-2 sm:space-y-0`}
                        >
                            <div className="w-full sm:w-32 font-semibold text-gray-900 border-b sm:border-b-0 border-gray-100 pb-1 sm:pb-0">{category}</div>
                            <div className="flex-1 w-full">
                                {statusContent}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatutoryHeatmap;
