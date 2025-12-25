import * as React from 'react';
import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { useCompliance } from '../hooks/useCompliance';
import { useTasks } from '../hooks/useTasks';
import { useAuthStore } from '../store/auth.store';
import AutoTaskModal from '../components/Tasks/AutoTaskModal';
import { Zap } from 'lucide-react';

const AutoTasksPage: React.FC = () => {
    const [showAutoTaskModal, setShowAutoTaskModal] = useState(false);
    const { clients } = useClients();
    const { staff } = useStaff();
    const { complianceTypes } = useCompliance();
    const { createBulkTasks } = useTasks();
    const { user } = useAuthStore();

    const handleAutoTaskGeneration = async (newTasks: any[]) => {
        try {
            const tasksWithAssignment = newTasks.map(task => ({
                ...task,
                assigned_by: user?.id || '',
            }));
            await createBulkTasks(tasksWithAssignment);
        } catch (error) {
            console.error('Auto task generation failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Auto Task Generation</h2>
                <p className="text-gray-600 mt-1">Automatically generate monthly compliance tasks</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                        <Zap className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Generate Monthly Tasks</h3>
                        <p className="text-gray-600">Create recurring compliance tasks for all active clients based on their work types.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAutoTaskModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Start Generation Wizard
                </button>
            </div>

            {/* Auto Task Modal */}
            {showAutoTaskModal && (
                <AutoTaskModal
                    clients={clients}
                    staff={staff}
                    complianceTypes={complianceTypes}
                    onClose={() => setShowAutoTaskModal(false)}
                    onGenerate={handleAutoTaskGeneration}
                />
            )}
        </div>
    );
};

export default AutoTasksPage;
