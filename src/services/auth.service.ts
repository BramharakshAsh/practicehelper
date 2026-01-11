import { UserRole, User } from '../types';
import { supabase } from './supabase';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterOrganizationData {
  firmName: string;
  pan: string;
  email: string;
  contactNumber: string;
  primaryPartner: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  };
}

export type AuthUser = User;

class AuthService {
  async login(role: UserRole, credentials: LoginCredentials): Promise<AuthUser> {
    // Supabase Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.username.includes('@') ? credentials.username : `${credentials.username}@demo.com`, // Fallback mapping
      password: credentials.password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed: No user data');

    // Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('users') // Our profile table is named 'users' in the public schema
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      id: profile.id,
      firm_id: profile.firm_id,
      email: profile.email,
      username: profile.username,
      full_name: profile.full_name,
      role: profile.role as UserRole,
      is_active: profile.is_active,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async registerOrganization(data: RegisterOrganizationData): Promise<void> {
    // 1. Sign up Partner
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.primaryPartner.email,
      password: data.primaryPartner.password,
      options: {
        data: {
          full_name: data.primaryPartner.fullName,
          username: data.primaryPartner.username,
        }
      }
    });

    // If user already exists, we might still want to proceed if it was a partial failure before
    if (authError && !authError.message.includes('already registered')) {
      throw authError;
    }

    let userId = authData.user?.id;

    // If signUp failed because user exists, try to get the user ID via signIn (or assume it's current if session exists)
    if (authError && authError.message.includes('already registered')) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.primaryPartner.email,
        password: data.primaryPartner.password,
      });
      if (signInError) throw new Error('User already exists but login failed. Please check password.');
      userId = signInData.user?.id;
    }

    if (!userId) throw new Error('Sign up failed: User ID missing');

    // 2. Create Firm (Now RLS allows this for anon/auth)
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .insert({
        name: data.firmName,
        pan: data.pan,
        email: data.email,
        contact_number: data.contactNumber,
      })
      .select()
      .single();

    if (firmError) {
      if (firmError.message.includes('duplicate key') && firmError.message.includes('pan')) {
        throw new Error('A firm with this PAN is already registered.');
      }
      throw firmError;
    }

    // 3. Create User Profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        firm_id: firm.id,
        email: data.primaryPartner.email,
        username: data.primaryPartner.username,
        full_name: data.primaryPartner.fullName,
        role: 'partner',
        is_active: true,
      });

    // If profile already exists (partial failure before), we might want to update it
    if (profileError && profileError.message.includes('duplicate key')) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ firm_id: firm.id })
        .eq('id', userId);
      if (updateError) throw updateError;
    } else if (profileError) {
      throw profileError;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return profile as AuthUser;
  }
}

export const authService = new AuthService();