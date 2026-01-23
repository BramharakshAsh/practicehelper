import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
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
  persist(
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
            const logoutPromise = authService.logout();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Logout timeout after 5s')), 5000)
            );
            await Promise.race([logoutPromise, timeoutPromise]);
          }, 'User logout');
        } catch (error) {
          console.warn('[AuthStore] Logout error (continuing with local logout):', error);
        } finally {
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