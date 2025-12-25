import { supabase } from './supabase';
import { UserRole, User } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export type AuthUser = User;

const HARDCODED_USERS: Record<string, { user: AuthUser; password: string }> = {
  admin: {
    password: 'admin123',
    user: {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      firm_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'admin@democaassociates.com',
      username: 'admin',
      full_name: 'Rajesh Sharma (Partner)',
      role: 'partner',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  manager: {
    password: 'manager123',
    user: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      firm_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'manager@democaassociates.com',
      username: 'manager',
      full_name: 'Suresh Kumar (Manager)',
      role: 'manager',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  staff: {
    password: 'staff123',
    user: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      firm_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'staff@democaassociates.com',
      username: 'staff',
      full_name: 'Anita Desai (Staff)',
      role: 'staff',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

class AuthService {
  async login(role: UserRole, credentials: LoginCredentials): Promise<AuthUser> {
    try {
      // 0. Check hardcoded credentials for testing
      const hardcodedUser = HARDCODED_USERS[credentials.username];
      if (hardcodedUser && hardcodedUser.password === credentials.password) {
        if (hardcodedUser.user.role === role) {
          console.log('Detected hardcoded credentials, attempting background Supabase sign-in...');

          // Attempt background sign-in to Supabase to establish session for RLS
          try {
            let email = hardcodedUser.user.email;
            await supabase.auth.signInWithPassword({
              email,
              password: credentials.password,
            });
            console.log('Background Supabase sign-in successful');
          } catch (authError) {
            console.warn('Background Supabase sign-in failed, continuing with mock session:', authError);
            // We continue even if Supabase fails, but write operations will likely fail due to RLS
          }

          return hardcodedUser.user;
        } else {
          throw new Error('Unauthorized role for this user');
        }
      }

      // 1. Authenticate with Supabase Auth (GoTrue)
      let email = credentials.username;

      // Demo convenience: map username to email
      if (!email.includes('@')) {
        const mapping: Record<string, string> = {
          admin: 'admin@democaassociates.com',
          manager: 'manager@democaassociates.com',
          staff: 'staff@democaassociates.com',
          staff2: 'staff2@democaassociates.com',
        };
        email = mapping[email] || email;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: credentials.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      // 2. Fetch the detailed profile from public.users
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error('User profile not found');
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error('Unauthorized role');
      }

      return profile;
    } catch (error) {
      console.error('Login error:', error);
      throw error instanceof Error ? error : new Error('Authentication failed');
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
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