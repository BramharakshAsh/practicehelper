import { createClient } from '@supabase/supabase-js';
import { Staff } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

class StaffService {
  async getStaff(): Promise<Staff[]> {
    const user = useAuthStore.getState().user;
    const firmId = user?.firm_id;
    if (!firmId) return [];

    let query = supabase
      .from('staff')
      .select(`
        *,
        user:users!staff_user_id_fkey(*)
      `)
      .eq('firm_id', firmId)
      .eq('is_active', true);

    if (user.role === 'manager') {
      // Manager sees themselves AND staff assigned to them
      query = query.or(`manager_id.eq.${user.id},user_id.eq.${user.id}`);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    // Map joined user data back to Staff interface structure if needed, 
    // or just return as is if the component handles it.
    // Based on the Staff interface, we might need to flatten or map.
    return (data || []).map(s => ({
      ...s,
      role: s.user?.role || s.role,
    })) as Staff[];
  }

  async createStaff(staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'> & { password?: string }): Promise<Staff> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    if (!staffData.password) {
      throw new Error('Password is required to create a staff account');
    }

    // 1. Create Auth User
    // We use a temporary client to avoid signing out the current user
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

    const tempClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const authRole = (staffData.role === 'paid_staff' || staffData.role === 'articles') ? 'staff' : staffData.role;

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: staffData.email,
      password: staffData.password,
      options: {
        data: {
          full_name: staffData.name,
          username: staffData.email.split('@')[0],
          role: authRole,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    const userId = authData.user.id;
    const { password, ...staffDetails } = staffData;

    // 2. Create Public User Profile
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        firm_id: firmId,
        email: staffData.email,
        username: staffData.email.split('@')[0],
        full_name: staffData.name,
        role: authRole,
        is_active: staffData.is_active
      });

    if (userError) {
      console.error('Error creating public user:', userError);
      // If we fail here, we should ideally cleanup the auth user, but for now we throw
      throw userError;
    }

    // 3. Create Staff Entry
    const currentUser = useAuthStore.getState().user;
    const finalManagerId = staffDetails.manager_id || (currentUser?.role === 'manager' ? currentUser.id : undefined);

    const { data, error } = await supabase
      .from('staff')
      .insert({
        ...staffDetails,
        user_id: userId,
        firm_id: firmId,
        manager_id: finalManagerId,
      })
      .select()
      .single();

    if (error) throw error;
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

  async deleteStaff(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
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
