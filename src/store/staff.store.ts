import { create } from 'zustand';
import { Staff } from '../types';
import { staffService } from '../services/staff.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface StaffState {
  staff: Staff[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStaff: () => Promise<void>;
  createStaff: (staff: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'> & { password?: string }) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  importStaff: (staff: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  clearError: () => void;
}

export const useStaffStore = create<StaffState>((set) => ({
  staff: [],
  isLoading: false,
  error: null,

  fetchStaff: async () => {
    console.log('[StaffStore] fetchStaff called');
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const staff = await staffService.getStaff();
      console.log('[StaffStore] fetchStaff success, records:', staff.length);
      set({ staff, isLoading: false });
    }, 'Fetch staff').catch((error) => {
      console.error('[StaffStore] fetchStaff error:', error);
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
    });
  },

  createStaff: async (staffData) => {
    console.log('[StaffStore] createStaff called with:', staffData.email);
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const newStaff = await staffService.createStaff(staffData);
      console.log('[StaffStore] createStaff success, new member:', newStaff);
      set(state => ({
        staff: [newStaff, ...state.staff],
        isLoading: false
      }));
    }, 'Create staff').catch((error) => {
      console.error('[StaffStore] createStaff error:', error);
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  updateStaff: async (id, updates) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const updatedStaff = await staffService.updateStaff(id, updates);
      set(state => ({
        staff: state.staff.map(member =>
          member.id === id ? updatedStaff : member
        ),
        isLoading: false
      }));
    }, 'Update staff').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  deleteStaff: async (id) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      await staffService.deleteStaff(id);
      set(state => ({
        staff: state.staff.filter(member => member.id !== id),
        isLoading: false
      }));
    }, 'Delete staff').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  importStaff: async (staffData) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const newStaff = await staffService.importStaff(staffData);
      set(state => ({
        staff: [...newStaff, ...state.staff],
        isLoading: false
      }));
    }, 'Import staff').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false
      });
      throw error;
    });
  },

  clearError: () => set({ error: null }),
}));