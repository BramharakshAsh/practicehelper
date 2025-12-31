import React from 'react';
import { Plus, Calendar, Mail, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
    onAddTask: () => void;
    onScheduleFiling: () => void;
    onSendReminder: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAddTask, onScheduleFiling, onSendReminder }) => {
    const navigate = useNavigate();

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
            label: 'Schedule Filing',
            icon: Calendar,
            onClick: onScheduleFiling,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            hover: 'hover:bg-purple-100'
        },
        {
            label: 'Send Client Reminder',
            icon: Mail,
            onClick: onSendReminder,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            hover: 'hover:bg-orange-100'
        },
        {
            label: 'Import Data',
            icon: Upload,
            onClick: () => navigate('/import'), // Assuming /import route exists or will exist
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
