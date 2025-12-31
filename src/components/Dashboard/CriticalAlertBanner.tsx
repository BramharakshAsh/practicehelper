import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Task, ComplianceType } from '../../types';
import { useNavigate } from 'react-router-dom';

interface CriticalAlertBannerProps {
    tasks: Task[];
    complianceTypes: ComplianceType[];
}

const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({ tasks, complianceTypes }) => {
    const navigate = useNavigate();

    // Calculate overdue tasks
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdueTasks = tasks.filter(task => {
        if (task.status === 'filed_completed') return false;
        const dueDate = new Date(task.due_date);
        // Compare dates only, ignoring time
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return dueDateOnly < today;
    });

    const awaitingClientTasks = tasks.filter(task =>
        task.status === 'awaiting_client_data'
    );

    if (overdueTasks.length === 0 && awaitingClientTasks.length === 0) {
        return null;
    }

    // Group overdue by compliance category
    const overdueByCategory = overdueTasks.reduce((acc, task) => {
        const compliance = complianceTypes.find(ct => ct.id === task.compliance_type_id);
        const category = compliance?.category || 'Other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const overdueText = Object.entries(overdueByCategory)
        .map(([category, count]) => `${count} ${category}`)
        .join(', ');

    const handleViewTasks = () => {
        // Navigate to tasks page with filter
        navigate('/tasks?filter=overdue');
    };

    return (
        <div className="sticky top-0 z-50 w-full bg-red-600 text-white shadow-md p-3">
            <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                    <div className="font-medium text-lg">
                        {overdueTasks.length > 0 && (
                            <span>
                                {overdueTasks.length} Filings Overdue ({overdueText} filings overdue)
                            </span>
                        )}
                        {overdueTasks.length > 0 && awaitingClientTasks.length > 0 && (
                            <span className="mx-2">|</span>
                        )}
                        {awaitingClientTasks.length > 0 && (
                            <span>{awaitingClientTasks.length} Tasks Awaiting Client Data</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleViewTasks}
                    className="px-4 py-1.5 bg-white text-red-600 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors shadow-sm"
                >
                    View Tasks
                </button>
            </div>
        </div>
    );
};

export default CriticalAlertBanner;
