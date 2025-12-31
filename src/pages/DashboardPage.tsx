import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useClients } from '../hooks/useClients';
import { useStaff } from '../hooks/useStaff';
import { useCompliance } from '../hooks/useCompliance';
import CriticalAlertBanner from '../components/Dashboard/CriticalAlertBanner';
import InsightCards from '../components/Dashboard/InsightCards';
import StatutoryHeatmap from '../components/Dashboard/StatutoryHeatmap';
import UrgentTasksTable from '../components/Dashboard/UrgentTasksTable';
import ClientDependencyWidget from '../components/Dashboard/ClientDependencyWidget';
import StaffLoadSnapshot from '../components/Dashboard/StaffLoadSnapshot';
import QuickActions from '../components/Dashboard/QuickActions';
import TaskModal from '../components/Tasks/TaskModal';
import AutoTaskModal from '../components/Tasks/AutoTaskModal';
import { Task } from '../types';

const DashboardPage: React.FC = () => {
    const { tasks, createTask } = useTasks();
    const { clients } = useClients();
    const { staff } = useStaff();
    const { complianceTypes } = useCompliance();

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);

    const handleTaskCreate = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
        await createTask(task);
        setShowTaskModal(false);
    };

    const handleScheduleFiling = async (newTasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]) => {
        for (const task of newTasks) {
            await createTask(task);
        }
        setShowAutoScheduleModal(false);
    };

    const handleSendReminder = () => {
        alert('Client Reminder feature coming soon!');
    };

    return (
        <div className="space-y-6">
            {/* Section A: Critical Alert Strip - Sticky */}
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-6 sticky top-0 z-40">
                <CriticalAlertBanner tasks={tasks} complianceTypes={complianceTypes} />
            </div>

            {/* Section B: Today's Reality Cards */}
            <InsightCards
                tasks={tasks}
                staff={staff}
                complianceTypes={complianceTypes}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section C: Statutory Heatmap */}
                    <StatutoryHeatmap tasks={tasks} complianceTypes={complianceTypes} />

                    {/* Section D: Urgent Tasks Table */}
                    <UrgentTasksTable tasks={tasks} clients={clients} staff={staff} />

                    {/* Section E: Client Dependency Tracker */}
                    <ClientDependencyWidget tasks={tasks} clients={clients} />
                </div>

                {/* Side Column (1/3 width) */}
                <div className="space-y-6">
                    {/* Section G: Quick Actions (Moved up for better access on desktop based on layout flow) */}
                    <QuickActions
                        onAddTask={() => setShowTaskModal(true)}
                        onScheduleFiling={() => setShowAutoScheduleModal(true)}
                        onSendReminder={handleSendReminder}
                    />

                    {/* Section F: Staff Load Snapshot */}
                    <StaffLoadSnapshot tasks={tasks} staff={staff} />
                </div>
            </div>

            {/* Modals */}
            {showTaskModal && (
                <TaskModal
                    onClose={() => setShowTaskModal(false)}
                    onSubmit={handleTaskCreate}
                    complianceTypes={complianceTypes}
                    clients={clients}
                    staff={staff}
                />
            )}

            {showAutoScheduleModal && (
                <AutoTaskModal
                    onClose={() => setShowAutoScheduleModal(false)}
                    onSubmit={handleScheduleFiling}
                    complianceTypes={complianceTypes}
                    clients={clients}
                    staff={staff}
                />
            )}
        </div>
    );
};

export default DashboardPage;
