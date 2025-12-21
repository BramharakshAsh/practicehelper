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
      // Query users table for authentication
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('role', role)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        throw new Error('Invalid credentials');
      }

      // In production, you would verify password hash here
      // For demo, we'll use simple password check
      const validPasswords = {
        'admin': 'admin123',
        'staff': 'staff123',
        'manager': 'manager123'
      };

      if (validPasswords[credentials.username as keyof typeof validPasswords] !== credentials.password) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return user;
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