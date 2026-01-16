import { create } from 'zustand';
import { UserRole, User } from '../types';
import { authService, LoginCredentials } from '../services/auth.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });

      await handleAsyncError(async () => {
        const user = await authService.login(credentials);
        set({
          user,
          isAuthenticated: true,
          isLoading: false
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
      set({ isLoading: true });

      try {
        await handleAsyncError(async () => {
          await authService.logout();
        }, 'User logout');
      } finally {
        // Always clear local auth state regardless of whether server-side logout succeeded
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    },

    setUser: (user: User | null) => {
      set({ user, isAuthenticated: !!user, isLoading: false });
    },

    clearError: () => set({ error: null }),
  })
);