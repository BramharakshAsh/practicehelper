import * as React from 'react';
import { useTasks } from '../hooks/useTasks';
import { useStaff } from '../hooks/useStaff';
import { useClients } from '../hooks/useClients';
import { useCompliance } from '../hooks/useCompliance';
import { useAuthStore } from '../store/auth.store';
import TaskBoard from '../components/Tasks/TaskBoard';

const TasksPage: React.FC = () => {
    const { tasks, createTask, updateTask, deleteTask } = useTasks();
    const { staff } = useStaff();
    const { clients } = useClients();
    const { complianceTypes } = useCompliance();
    const { user } = useAuthStore();

    const currentRole = user?.role || 'staff';
    const currentStaffId = ['staff', 'paid_staff', 'articles'].includes(currentRole) ? user?.id : undefined;

    return (
        <TaskBoard
            tasks={tasks}
            staff={staff}
            clients={clients}
            complianceTypes={complianceTypes}
            currentRole={currentRole}
            currentStaffId={currentStaffId}
            onTaskUpdate={updateTask}
            onTaskCreate={createTask}
            onTaskDelete={deleteTask}
        />
    );
};

export default TasksPage;
