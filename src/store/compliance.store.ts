import { create } from 'zustand';
import { ComplianceType } from '../types';
import { complianceService } from '../services/compliance.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface ComplianceState {
  complianceTypes: ComplianceType[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchComplianceTypes: () => Promise<void>;
  createComplianceType: (complianceType: Omit<ComplianceType, 'id' | 'firm_id' | 'created_at'>) => Promise<void>;
  clearError: () => void;
}

export const useComplianceStore = create<ComplianceState>((set) => ({
  complianceTypes: [],
  isLoading: false,
  error: null,

  fetchComplianceTypes: async () => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const complianceTypes = await complianceService.getComplianceTypes();
      set({ complianceTypes, isLoading: false });
    }, 'Fetch compliance types').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
    });
  },

  createComplianceType: async (complianceTypeData) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const newComplianceType = await complianceService.createComplianceType(complianceTypeData);
      set(state => ({
        complianceTypes: [...state.complianceTypes, newComplianceType],
        isLoading: false
      }));
    }, 'Create compliance type').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  clearError: () => set({ error: null }),
}));