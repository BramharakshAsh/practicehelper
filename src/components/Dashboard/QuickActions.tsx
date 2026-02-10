import React from 'react';
import { Plus, User, Users, Upload } from 'lucide-react';

interface QuickActionsProps {
    onAddTask: () => void;
    onAddClient: () => void;
    onAddStaff?: () => void;
    onImportData: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAddTask, onAddClient, onAddStaff, onImportData }) => {

    const actions = [
        {
            label: 'Add Task',
            icon: Plus,
            onClick: onAddTask,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            hover: 'hover:bg-blue-100'
        },
        {
            label: 'Add Client',
            icon: User,
            onClick: onAddClient,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            hover: 'hover:bg-purple-100'
        },
        // Conditionally add 'Add Staff'
        ...(onAddStaff ? [{
            label: 'Add Staff',
            icon: Users,
            onClick: onAddStaff,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            hover: 'hover:bg-orange-100'
        }] : []),
        {
            label: 'Import Data',
            icon: Upload,
            onClick: onImportData,
            color: 'text-green-600',
            bg: 'bg-green-50',
            hover: 'hover:bg-green-100'
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        data-walkthrough={`quick-action-${action.label.toLowerCase().replace(' ', '-')}`}
                        className={`w-full flex items-center p-3 rounded-lg border border-transparent ${action.bg} ${action.color} ${action.hover} transition-all font-medium`}
                    >
                        <action.icon className="h-5 w-5 mr-3" />
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
