import { create } from 'zustand';
import { Staff } from '../types';
import { staffService } from '../services/staff.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface StaffState {
  staff: Staff[];
  isLoading: boolean;
  hasFetched: boolean;
  error: string | null;
  pendingDeletions: Record<string, { timer: any; staff: Staff }>;

  // Actions
  fetchStaff: () => Promise<void>;
  createStaff: (staff: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'> & { password?: string }) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  undoStaffDeletion: (id: string) => void;
  importStaff: (staff: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  clearError: () => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  isLoading: false,
  hasFetched: false,
  error: null,
  pendingDeletions: {},

  fetchStaff: async () => {
    console.log('[StaffStore] fetchStaff called');
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const staff = await staffService.getStaff();
      console.log('[StaffStore] fetchStaff success, records:', staff.length);
      set({ staff, isLoading: false, hasFetched: true });
    }, 'Fetch staff').catch((error) => {
      console.error('[StaffStore] fetchStaff error:', error);
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false,
        hasFetched: true
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
    const staffMember = get().staff.find(s => s.id === id);
    if (!staffMember) return;

    // Remove from active staff list immediately (Optimistic UI)
    set(state => ({
      staff: state.staff.filter(member => member.id !== id),
    }));

    // Start 15 second timer (15000 ms)
    const timeoutId = setTimeout(async () => {
      const { pendingDeletions } = get();
      if (pendingDeletions[id]) {
        try {
          // Pass the user_id for permanent deletion from auth.users
          await staffService.deleteStaffPermanently(staffMember.user_id!);
          set(state => {
            const newPending = { ...state.pendingDeletions };
            delete newPending[id];
            return { pendingDeletions: newPending };
          });
          console.log(`[StaffStore] Permanent deletion completed for ${staffMember.name}`);
        } catch (error) {
          console.error('[StaffStore] Final deletion failed:', error);
        }
      }
    }, 15000);

    set(state => ({
      pendingDeletions: {
        ...state.pendingDeletions,
        [id]: { timer: timeoutId, staff: staffMember }
      }
    }));
  },

  undoStaffDeletion: (id) => {
    const pending = get().pendingDeletions[id];
    if (!pending) return;

    clearTimeout(pending.timer);

    set(state => {
      const newPending = { ...state.pendingDeletions };
      delete newPending[id];
      return {
        staff: [pending.staff, ...state.staff].sort((a, b) => a.name.localeCompare(b.name)),
        pendingDeletions: newPending
      };
    });
  },

  importStaff: async (staffData) => {
    set({ isLoading: true, error: null });

    return await handleAsyncError(async () => {
      const result = await staffService.importStaff(staffData);

      // Refetch staff to get updated state
      const staff = await staffService.getStaff();

      set({
        staff,
        isLoading: false
      });

      return result; // Pass result back to UI
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