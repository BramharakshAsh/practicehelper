import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, User } from '../types';
import { authService, LoginCredentials } from '../services/auth.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (role: UserRole, credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (role: UserRole, credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
          const user = await authService.login(role, credentials);
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

        await handleAsyncError(async () => {
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }, 'User logout').catch((error) => {
          set({
            error: ErrorService.getErrorMessage(error),
            isLoading: false
          });
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user, isLoading: false });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);