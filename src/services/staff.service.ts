import { createClient } from '@supabase/supabase-js';
import { Staff } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { DBStaffResponse } from '../types/database.types';
import { generateSecurePassword, sendStaffWelcomeEmail } from '../utils/email.utils';
import { devLog, devWarn, devError } from './logger';
import { getEnvVar } from '../utils/env';

class StaffService {
  async getStaff(): Promise<Staff[]> {
    devLog('[StaffService] Fetching staff...');
    const user = useAuthStore.getState().user;
    const firmId = user?.firm_id;
    devLog('[StaffService] Current User Firm ID:', firmId);
    if (!firmId) {
      devWarn('[StaffService] No firm ID found, returning empty list');
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
      devLog('[StaffService] Manager role detected, filtering by manager_id');
      // Manager sees themselves AND staff assigned to them
      query = query.or(`manager_id.eq.${user.id},user_id.eq.${user.id}`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      devError('[StaffService] Error fetching staff:', error);
      throw error;
    }

    devLog(`[StaffService] Fetched ${data?.length || 0} staff members`);
    // Map joined user data back to Staff interface structure if needed
    return ((data as unknown as DBStaffResponse[]) || []).map(s => ({
      ...s,
      role: s.user?.role || s.role,
    })) as Staff[];
  }

  async createStaff(staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'> & { password?: string }): Promise<Staff> {
    devLog('[StaffService] Starting staff creation for:', staffData.email);
    const firmId = useAuthStore.getState().user?.firm_id;

    if (!firmId) {
      devError('[StaffService] Missing firm ID during creation');
      throw new Error('User not authenticated or missing firm ID');
    }

    // Auto-generate password if not provided
    const password = staffData.password || generateSecurePassword();
    devLog('[StaffService] Password generated/provided for new staff');

    // 1. Create Auth User
    devLog('[StaffService] Creating Auth User...');
    const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      devError('[StaffService] Missing Supabase environment variables');
      throw new Error('Supabase configuration is missing. Please check the server environment.');
    }

    // Pre-check: Does a user with this email already exist in our public profiles?
    devLog('[StaffService] Checking for existing user profile...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', staffData.email.trim())
      .maybeSingle();

    if (checkError) {
      devError('[StaffService] Error checking existing user:', checkError);
    }

    if (existingUser) {
      devError('[StaffService] User already exists with this email:', staffData.email);
      throw new Error('A user with this email address already exists.');
    }

    const tempClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const authRole = staffData.role;
    devLog('[StaffService] Using role for Auth/Profile:', authRole);

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: staffData.email.trim(),
      password: password,
      options: {
        data: {
          full_name: staffData.name,
          username: staffData.email.trim(), // Use full email for uniqueness
          role: authRole,
        }
      }
    });

    if (authError) {
      devError('[StaffService] Auth SignUp Error:', authError);

      // Provide more helpful error messages for common scenarios
      if (authError.message.includes('already registered') || authError.status === 400) {
        throw new Error('This email is already registered. Please use a different email or log in.');
      }

      if (authError.message.includes('rate limit')) {
        devWarn('[StaffService] Supabase rate limit hit for emails');
        throw new Error('Too many requests. Please try again in a few minutes.');
      }

      throw authError;
    }
    if (!authData.user) {
      devError('[StaffService] Auth SignUp succeeded but no user returned');
      throw new Error('Failed to create auth user');
    }

    const userId = authData.user.id;
    devLog('[StaffService] Auth User created with ID:', userId);
    const { password: providedPassword, ...staffDetails } = staffData;

    // 2. Create Public User Profile
    devLog('[StaffService] Creating public user profile with ID:', userId);
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
      devError('[StaffService] Error creating public user profile:', userError);
      // If we fail here, it might be because the user already exists in auth but not in users
      // or a duplicate username error.
      throw userError;
    }

    // 3. Create Staff Entry
    devLog('[StaffService] Creating staff entry...');
    const currentUser = useAuthStore.getState().user;

    // Ensure manager_id is null if it's an empty string
    const sanitizedManagerId = staffDetails.manager_id === '' ? null : staffDetails.manager_id;
    const finalManagerId = sanitizedManagerId || (currentUser?.role === 'manager' ? currentUser.id : null);

    devLog('[StaffService] Final Manager ID:', finalManagerId);

    const staffPayload = {
      ...staffDetails,
      manager_id: finalManagerId,
      user_id: userId,
      firm_id: firmId,
    };

    devLog('[StaffService] Final staff table payload:', staffPayload);

    const { data, error } = await supabase
      .from('staff')
      .insert(staffPayload)
      .select()
      .single();

    if (error) {
      devError('[StaffService] Error creating staff record:', error);
      // Attempt to log more details about the error
      if (error.details) devError('[StaffService] Error details:', error.details);
      if (error.hint) devError('[StaffService] Error hint:', error.hint);
      throw error;
    }

    devLog('[StaffService] Staff creation complete:', data);

    // Fetch firm details for the email
    const { data: firm } = await supabase.from('firms').select('name').eq('id', firmId).single();
    const firmName = firm?.name || 'Your Firm';

    // Send welcome email with credentials
    await sendStaffWelcomeEmail({
      email: staffData.email.trim(),
      name: staffData.name,
      password: password,
      firmName: firmName,
    });

    return data as unknown as DBStaffResponse;
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as DBStaffResponse;
  }

  async getStaffById(id: string): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .select(`*, user:users(*)`)
      .eq('id', id)
      .single();

    if (error) throw error;
    const s = data as unknown as DBStaffResponse;
    return { ...s, role: s.user?.role || s.role } as Staff;
  }

  async deleteStaffPermanently(userId: string): Promise<void> {
    devLog('[StaffService] Deleting tasks for user:', userId);
    // First delete all tasks assigned to the staff
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('staff_id', userId);

    if (taskError) {
      devError('[StaffService] Error deleting staff tasks:', taskError);
      throw taskError;
    }

    devLog('[StaffService] Deleting user permanently:', userId);
    const { error } = await supabase.rpc('delete_user_permanent', {
      target_user_id: userId
    });

    if (error) {
      devError('[StaffService] Error in permanent deletion:', error);
      throw error;
    }
  }

  async importStaff(staffList: any[]): Promise<{ success: number; failures: number; errors: string[] }> {
    devLog(`[StaffService] Starting import of ${staffList.length} staff members`);
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    // 1. Fetch current staff to resolve manager names
    const existingStaff = await this.getStaff();
    const results = {
      success: 0,
      failures: 0,
      errors: [] as string[]
    };

    // 2. Process each staff
    let rowIndex = 2; // Data starts at row 2
    for (const item of staffList) {
      const rowNum = rowIndex++;
      try {
        devLog(`[StaffService] Processing row ${rowNum}:`, item.email);

        // Resolve manager_id from manager_name
        let managerId: string | undefined = undefined;
        let managerName = (item.manager_name || '').trim();

        if (managerName && managerName.toLowerCase() !== 'unassigned') {
          const manager = existingStaff.find(s => s.name.toLowerCase() === managerName.toLowerCase());
          if (manager) {
            managerId = manager.user_id;
          } else {
            devWarn(`[StaffService] Row ${rowNum}: Manager "${managerName}" not found. Defaulting to Unassigned.`);
            results.errors.push(`Row ${rowNum}: Manager "${managerName}" not found. Defaulting to Unassigned.`);
          }
        }

        // Map role correctly
        let role: any = (item.role || '').toLowerCase().trim() || 'paid_staff';
        if (role === 'article') role = 'articles';
        if (role === 'paid staff') role = 'paid_staff';

        // Prepare data for creation
        const creationData = {
          name: (item.full_name || item.name || '').trim(),
          email: (item.email || '').trim(),
          role: role as any,
          phone: item.phone ? String(item.phone).trim() : undefined,
          manager_id: managerId,
          date_of_joining: item.joining_date instanceof Date
            ? item.joining_date.toISOString().split('T')[0]
            : (item.joining_date || new Date().toISOString().split('T')[0]),
          is_active: true
        };

        if (!creationData.name || !creationData.email) {
          throw new Error('Full Name and Email are required.');
        }

        const newMember = await this.createStaff(creationData);
        existingStaff.push(newMember); // Add to local cache so subsequent rows can reference this manager
        results.success++;
      } catch (err: any) {
        devError(`[StaffService] Row ${rowNum} failure:`, err);
        results.failures++;
        const errorMessage = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
        results.errors.push(`Row ${rowNum}: ${errorMessage}`);
      }
    }

    return results;
  }
}

export const staffService = new StaffService();
