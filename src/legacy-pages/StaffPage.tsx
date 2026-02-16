import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useStaff } from '../hooks/useStaff';
import { useTasksStore } from '../store/tasks.store';
import { useAuthStore } from '../store/auth.store';
import StaffList from '../components/Staff/StaffList';

const StaffPage: React.FC = () => {
    const { user } = useAuthStore();
    const { staff, createStaff, updateStaff, deleteStaff } = useStaff();
    const { tasks } = useTasksStore();

    // Protect route from non-partner/manager/admin
    if (user && !['partner', 'manager'].includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <StaffList
            staff={staff}
            tasks={tasks}
            onStaffUpdate={updateStaff}
            onStaffCreate={createStaff}
            onStaffDelete={deleteStaff}
        />
    );
};

export default StaffPage;
