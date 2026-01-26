import { useEffect } from 'react';
import { useComplianceStore } from '../store/compliance.store';
import { ComplianceType } from '../types';

export const useCompliance = () => {
  const {
    complianceTypes,
    isLoading,
    hasFetched,
    error,
    fetchComplianceTypes,
    createComplianceType,
    clearError,
  } = useComplianceStore();

  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchComplianceTypes();
    }
  }, [hasFetched, isLoading, fetchComplianceTypes]);

  const handleCreateComplianceType = (complianceTypeData: Omit<ComplianceType, 'id' | 'firm_id' | 'created_at'>) => createComplianceType(complianceTypeData);

  return {
    complianceTypes,
    isLoading,
    error,
    createComplianceType: handleCreateComplianceType,
    refetch: fetchComplianceTypes,
    clearError,
  };
};