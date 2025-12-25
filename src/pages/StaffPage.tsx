import * as React from 'react';
import { useStaff } from '../hooks/useStaff';
import { useTasksStore } from '../store/tasks.store';
import StaffList from '../components/Staff/StaffList';

const StaffPage: React.FC = () => {
    const { staff, createStaff, updateStaff } = useStaff();
    const { tasks } = useTasksStore();

    return (
        <StaffList
            staff={staff}
            tasks={tasks}
            onStaffUpdate={updateStaff}
            onStaffCreate={createStaff}
        />
    );
};

export default StaffPage;
