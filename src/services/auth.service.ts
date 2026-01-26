import { User } from '../types';
import { supabase } from './supabase';
import { handleAsyncError } from './error.service';

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
    pan: string;
    email: string;
    password: string;
  };
}

export type AuthUser = User;

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    return handleAsyncError(async () => {
      // Supabase Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username.includes('@') ? credentials.username : `${credentials.username}@demo.com`, // Fallback mapping
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed: No user data');

      // Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return profile as AuthUser;
    }, 'User login');
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.functions.invoke('request-password-reset', {
      body: { email }
    });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  async registerOrganization(data: RegisterOrganizationData): Promise<void> {
    return handleAsyncError(async () => {
      console.log('[Registration] Starting registration for:', data.primaryPartner.email);

      // 1. Sign up Partner
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.primaryPartner.email,
        password: data.primaryPartner.password,
        options: {
          data: {
            full_name: data.primaryPartner.fullName,
            pan: data.primaryPartner.pan,
          }
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        throw authError;
      }

      let userId = authData.user?.id;

      if (authError && authError.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.primaryPartner.email,
          password: data.primaryPartner.password,
        });
        if (signInError) throw new Error('User already exists but login failed. Please check password.');
        userId = signInData.user?.id;
      }

      if (!userId) throw new Error('Sign up failed: User ID missing');

      // 2. Create Firm
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
          username: data.primaryPartner.email.split('@')[0],
          pan: data.primaryPartner.pan,
          full_name: data.primaryPartner.fullName,
          role: 'partner',
          is_active: true,
        });

      if (profileError && profileError.message.includes('duplicate key')) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ firm_id: firm.id })
          .eq('id', userId);
        if (updateError) throw updateError;
      } else if (profileError) {
        throw profileError;
      }

      // 4. Create Staff Entry for the Partner
      await supabase
        .from('staff')
        .insert({
          user_id: userId,
          firm_id: firm.id,
          name: data.primaryPartner.fullName,
          email: data.primaryPartner.email,
          is_active: true,
          date_of_joining: new Date().toISOString().split('T')[0],
        });

      console.log('[Registration] ✅ Registration completed successfully!');
    }, 'Organization registration');
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

  async getFirm(firmId: string): Promise<any> {
    const { data, error } = await supabase
      .from('firms')
      .select('*')
      .eq('id', firmId)
      .single();

    if (error) throw error;
    return data;
  }
}

export const authService = new AuthService();