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
        <div className="sticky top-0 z-10 w-full bg-red-600 text-white shadow-md">
            <div className="container mx-auto max-w-7xl flex items-center justify-between px-4 py-2 sm:py-3 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-pulse flex-shrink-0" />
                    <div className="font-medium text-sm sm:text-base truncate">
                        {overdueTasks.length > 0 && (
                            <span className="inline sm:hidden">{overdueTasks.length} Overdue</span>
                        )}
                        {overdueTasks.length > 0 && (
                            <span className="hidden sm:inline">
                                {overdueTasks.length} Filings Overdue ({overdueText})
                            </span>
                        )}
                        {overdueTasks.length > 0 && awaitingClientTasks.length > 0 && (
                            <span className="mx-1.5 sm:mx-2">|</span>
                        )}
                        {awaitingClientTasks.length > 0 && (
                            <span className="inline sm:hidden">{awaitingClientTasks.length} Awaiting</span>
                        )}
                        {awaitingClientTasks.length > 0 && (
                            <span className="hidden sm:inline">{awaitingClientTasks.length} Awaiting Client Data</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleViewTasks}
                    className="flex-shrink-0 ml-3 px-3 py-1.5 sm:px-4 sm:py-1.5 bg-white text-red-600 rounded-md font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors shadow-sm"
                >
                    View
                </button>
            </div>
        </div>
    );
};

export default CriticalAlertBanner;
