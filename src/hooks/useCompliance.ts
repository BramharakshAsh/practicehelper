import { useEffect } from 'react';
import { useComplianceStore } from '../store/compliance.store';
import { ComplianceType } from '../types';

export const useCompliance = () => {
  const {
    complianceTypes,
    isLoading,
    error,
    fetchComplianceTypes,
    createComplianceType,
    clearError,
  } = useComplianceStore();

  useEffect(() => {
    if (complianceTypes.length === 0 && !isLoading) {
      fetchComplianceTypes();
    }
  }, [complianceTypes.length, isLoading, fetchComplianceTypes]);

  const handleCreateComplianceType = async (complianceTypeData: Omit<ComplianceType, 'id' | 'firm_id' | 'created_at'>) => {
    try {
      await createComplianceType(complianceTypeData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  return {
    complianceTypes,
    isLoading,
    error,
    createComplianceType: handleCreateComplianceType,
    refetch: fetchComplianceTypes,
    clearError,
  };
};