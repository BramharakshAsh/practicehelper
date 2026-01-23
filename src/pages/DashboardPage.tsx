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

import { useAuthStore } from '../store/auth.store';

const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const { tasks, createTask } = useTasks();
    const { clients } = useClients();
    const { staff } = useStaff();
    const { complianceTypes } = useCompliance();

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);

    const handleTaskCreate = async (task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => {
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
        const msg = "Dear Client, \n\nThis is a reminder to please submit your pending documents for the upcoming statutory deadlines.\n\nRegards,\nFirm Flow";
        navigator.clipboard.writeText(msg).then(() => {
            // In a real app we would use a toast notification here
            // For now, using a more descriptive alert or just relying on user action
            // But since we can't show toast easily without adding a lib or context, let's just alert for now but validly.
            alert('Reminder text copied to clipboard! You can now paste it into WhatsApp/Email.');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy reminder text.');
        });
    };

    return (
        <div className="space-y-5 animate-fade-in" data-walkthrough="dashboard-overview">
            {/* Section A: Critical Alert Strip - Sticky */}
            <div className="-mx-3 sm:-mx-4 lg:-mx-5 -mt-5 mb-4 sticky top-0 z-30">
                <CriticalAlertBanner tasks={tasks} complianceTypes={complianceTypes} />
            </div>

            {/* Section B: Today's Reality Cards */}
            <InsightCards
                tasks={tasks}
                complianceTypes={complianceTypes}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Section C: Statutory Heatmap */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1">
                        <StatutoryHeatmap tasks={tasks} complianceTypes={complianceTypes} />
                    </div>

                    {/* Section D: Urgent Tasks Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1">
                        <UrgentTasksTable tasks={tasks} clients={clients} staff={staff} />
                    </div>

                    {/* Section E: Client Dependency Tracker */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1">
                        <ClientDependencyWidget tasks={tasks} clients={clients} />
                    </div>
                </div>

                {/* Side Column (1/3 width) */}
                <div className="space-y-5">
                    {/* Section G: Quick Actions */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1">
                        <QuickActions
                            onAddTask={() => setShowTaskModal(true)}
                            onScheduleFiling={() => setShowAutoScheduleModal(true)}
                            onSendReminder={handleSendReminder}
                        />
                    </div>

                    {/* Section F: Staff Load Snapshot - Only for Partners/Managers */}
                    {['partner', 'manager'].includes(user?.role || '') && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1">
                            <StaffLoadSnapshot tasks={tasks} staff={staff} />
                        </div>
                    )}
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
                    onGenerate={handleScheduleFiling}
                    complianceTypes={complianceTypes}
                    clients={clients}
                    staff={staff}
                />
            )}
        </div>
    );
};

export default DashboardPage;
