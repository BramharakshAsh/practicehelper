import { useEffect } from 'react';
import { useStaffStore } from '../store/staff.store';
import { Staff } from '../types';

export const useStaff = () => {
  const {
    staff,
    isLoading,
    hasFetched,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    unlockStaff,
    importStaff,
    clearError,
  } = useStaffStore();

  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchStaff();
    }
  }, [hasFetched, isLoading, fetchStaff]);

  const handleCreateStaff = (staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'> & { password?: string }) => createStaff(staffData);
  const handleUpdateStaff = (id: string, updates: Partial<Staff>) => updateStaff(id, updates);
  const handleDeleteStaff = (id: string) => deleteStaff(id);
  const handleUnlockStaff = (staffId: string, userId: string) => unlockStaff(staffId, userId);
  const handleImportStaff = (staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => importStaff(staffData);

  return {
    staff,
    isLoading,
    error,
    createStaff: handleCreateStaff,
    updateStaff: handleUpdateStaff,
    deleteStaff: handleDeleteStaff,
    unlockStaff: handleUnlockStaff,
    importStaff: handleImportStaff,
    refetch: fetchStaff,
    clearError,
  };
};