import { createClient } from '@supabase/supabase-js';
import { Staff } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

class StaffService {
  async getStaff(): Promise<Staff[]> {
    console.log('[StaffService] Fetching staff...');
    const user = useAuthStore.getState().user;
    const firmId = user?.firm_id;
    console.log('[StaffService] Current User Firm ID:', firmId);
    if (!firmId) {
      console.warn('[StaffService] No firm ID found, returning empty list');
      return [];
    }

    let query = supabase
      .from('staff')
      .select(`
        *,
        user:users!staff_user_id_fkey(*)
      `)
      .eq('firm_id', firmId)
      .eq('is_active', true);

    if (user.role === 'manager') {
      console.log('[StaffService] Manager role detected, filtering by manager_id');
      // Manager sees themselves AND staff assigned to them
      query = query.or(`manager_id.eq.${user.id},user_id.eq.${user.id}`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('[StaffService] Error fetching staff:', error);
      throw error;
    }

    console.log(`[StaffService] Fetched ${data?.length || 0} staff members`);
    // Map joined user data back to Staff interface structure if needed
    return (data || []).map(s => ({
      ...s,
      role: s.user?.role || s.role,
    })) as Staff[];
  }

  async createStaff(staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'> & { password?: string }): Promise<Staff> {
    console.log('[StaffService] Starting staff creation for:', staffData.email);
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) {
      console.error('[StaffService] Missing firm ID during creation');
      throw new Error('User not authenticated or missing firm ID');
    }

    if (!staffData.password) {
      console.error('[StaffService] Missing password for staff creation');
      throw new Error('Password is required to create a staff account');
    }

    // 1. Create Auth User
    console.log('[StaffService] Creating Auth User...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

    const tempClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const authRole = staffData.role;
    console.log('[StaffService] Using role for Auth/Profile:', authRole);

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: staffData.email,
      password: staffData.password,
      options: {
        data: {
          full_name: staffData.name,
          username: staffData.email, // Use full email for uniqueness
          role: authRole,
        }
      }
    });

    if (authError) {
      console.error('[StaffService] Auth SignUp Error:', authError);
      // Log more details if available
      if (authError.message.includes('rate limit')) {
        console.warn('[StaffService] Supabase rate limit hit for emails');
      }
      throw authError;
    }
    if (!authData.user) {
      console.error('[StaffService] Auth SignUp succeeded but no user returned');
      throw new Error('Failed to create auth user');
    }

    const userId = authData.user.id;
    console.log('[StaffService] Auth User created with ID:', userId);
    const { password, ...staffDetails } = staffData;

    // 2. Create Public User Profile
    console.log('[StaffService] Creating public user profile with ID:', userId);
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        firm_id: firmId,
        email: staffData.email,
        username: staffData.email, // Use full email for uniqueness
        full_name: staffData.name,
        role: authRole,
        is_active: staffData.is_active
      });

    if (userError) {
      console.error('[StaffService] Error creating public user profile:', userError);
      // If we fail here, it might be because the user already exists in auth but not in users
      // or a duplicate username error.
      throw userError;
    }

    // 3. Create Staff Entry
    console.log('[StaffService] Creating staff entry...');
    const currentUser = useAuthStore.getState().user;

    // Ensure manager_id is null if it's an empty string
    const sanitizedManagerId = staffDetails.manager_id === '' ? null : staffDetails.manager_id;
    const finalManagerId = sanitizedManagerId || (currentUser?.role === 'manager' ? currentUser.id : null);

    console.log('[StaffService] Final Manager ID:', finalManagerId);

    const staffPayload = {
      ...staffDetails,
      manager_id: finalManagerId,
      user_id: userId,
      firm_id: firmId,
    };

    console.log('[StaffService] Final staff table payload:', staffPayload);

    const { data, error } = await supabase
      .from('staff')
      .insert(staffPayload)
      .select()
      .single();

    if (error) {
      console.error('[StaffService] Error creating staff record:', error);
      // Attempt to log more details about the error
      if (error.details) console.error('[StaffService] Error details:', error.details);
      if (error.hint) console.error('[StaffService] Error hint:', error.hint);
      throw error;
    }

    console.log('[StaffService] Staff creation complete:', data);
    return data as Staff;
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Staff;
  }

  async getStaffById(id: string): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .select(`*, user:users(*)`)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { ...data, role: data.user?.role || data.role } as Staff;
  }

  async deleteStaffPermanently(userId: string): Promise<void> {
    console.log('[StaffService] Deleting user permanently:', userId);
    const { error } = await supabase.rpc('delete_user_permanent', {
      target_user_id: userId
    });

    if (error) {
      console.error('[StaffService] Error in permanent deletion:', error);
      throw error;
    }
  }

  async importStaff(staffList: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Staff[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const { data, error } = await supabase
      .from('staff')
      .insert(staffList.map(s => ({ ...s, firm_id: firmId })))
      .select();

    if (error) throw error;
    return data as Staff[];
  }
}

export const staffService = new StaffService();
