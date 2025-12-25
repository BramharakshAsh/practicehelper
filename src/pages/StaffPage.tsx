import * as React from 'react';
import { useStaff } from '../hooks/useStaff';
import StaffList from '../components/Staff/StaffList';

const StaffPage: React.FC = () => {
    const { staff, createStaff, updateStaff } = useStaff();

    return (
        <StaffList
            staff={staff}
            onStaffUpdate={updateStaff}
            onStaffCreate={createStaff}
        />
    );
};

export default StaffPage;
