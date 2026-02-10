import { create } from 'zustand';
import { User, Firm } from '../types';
import { authService, LoginCredentials } from '../services/auth.service';
import { ErrorService, handleAsyncError } from '../services/error.service';
import { devLog, devWarn } from '../services/logger';
import { scheduleAppDataCleanup } from '../services/supabase';

interface AuthState {
  user: User | null;
  firm: Firm | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setFirm: (firm: Firm | null) => void;
  setSession: (user: User | null, firm: Firm | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    firm: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials: LoginCredentials) => {
      devLog('[AuthStore] login called');
      set({ isLoading: true, error: null });

      await handleAsyncError(async () => {
        const user = await authService.login(credentials);
        let firm = null;
        if (user.firm_id) {
          firm = await authService.getFirm(user.firm_id);
        }

        set({
          user,
          firm,
          isAuthenticated: true,
          isLoading: false,
        });
      }, 'User login').catch((error) => {
        set({
          error: ErrorService.getErrorMessage(error),
          isLoading: false
        });
        throw error;
      });
    },

    logout: async () => {
      devLog('[AuthStore] logout called');
      set({ isLoading: true });

      try {
        await handleAsyncError(async () => {
          const logoutPromise = authService.logout();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Logout timeout after 5s')), 5000)
          );
          await Promise.race([logoutPromise, timeoutPromise]);
        }, 'User logout');
      } catch (error) {
        devWarn('[AuthStore] Logout error (continuing with local logout):', error);
      } finally {
        set({
          user: null,
          firm: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        scheduleAppDataCleanup();
      }
    },

    setUser: (user: User | null) => {
      set({ user });
    },

    setFirm: (firm: Firm | null) => {
      set({ firm });
    },

    setSession: (user: User | null, firm: Firm | null) => {
      devLog('[AuthStore] setSession called, hasUser:', !!user, 'hasFirm:', !!firm);
      set({
        user,
        firm,
        isAuthenticated: !!user,
        isLoading: false,
      });
    },

    clearError: () => set({ error: null }),
  })
);
