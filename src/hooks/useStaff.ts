import { useEffect } from 'react';
import { useStaffStore } from '../store/staff.store';
import { Staff } from '../types';

export const useStaff = () => {
  const {
    staff,
    isLoading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    importStaff,
    clearError,
  } = useStaffStore();

  useEffect(() => {
    if (staff.length === 0 && !isLoading) {
      fetchStaff();
    }
  }, [staff.length, isLoading, fetchStaff]);

  const handleCreateStaff = async (staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>) => {
    try {
      await createStaff(staffData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleUpdateStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      await updateStaff(id, updates);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteStaff(id);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleImportStaff = async (staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      await importStaff(staffData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  return {
    staff,
    isLoading,
    error,
    createStaff: handleCreateStaff,
    updateStaff: handleUpdateStaff,
    deleteStaff: handleDeleteStaff,
    importStaff: handleImportStaff,
    refetch: fetchStaff,
    clearError,
  };
};