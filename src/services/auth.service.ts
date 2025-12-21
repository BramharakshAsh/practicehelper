import { supabase } from './supabase';
import { UserRole, User } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export type AuthUser = User;

class AuthService {
  async login(role: UserRole, credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.rpc('login', {
        _username: credentials.username,
        _password: credentials.password,
        _role: role,
      });

      if (error) {
        throw new Error('Invalid credentials');
      }

      return data;
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }

  async logout(): Promise<void> {
    // Clear any session data if needed
    return Promise.resolve();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // In production, this would get the current authenticated user
    return null;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const authService = new AuthService();