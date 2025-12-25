import { supabase } from './supabase';
import { Staff } from '../types';
import { useAuthStore } from '../store/auth.store';

class StaffService {
  async getStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        staff_details:staff(*)
      `)
      .eq('is_active', true)
      .in('role', ['staff', 'manager'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match the Staff interface
    return (data || []).map(user => ({
      id: user.id,
      user_id: user.id,
      firm_id: user.firm_id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      employee_id: user.staff_details?.[0]?.employee_id,
      department: user.staff_details?.[0]?.department,
      specializations: user.staff_details?.[0]?.specializations || [],
      hourly_rate: user.staff_details?.[0]?.hourly_rate,
      is_available: user.staff_details?.[0]?.is_available ?? true,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));
  }

  async createStaff(staffData: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Staff> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    // First create the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        firm_id: firmId,
        email: staffData.email,
        username: staffData.email.split('@')[0], // Generate username from email
        password_hash: 'hashed_password', // In production, hash the password
        full_name: staffData.name,
        role: staffData.role,
        phone: staffData.phone,
        is_active: staffData.is_active,
      }])
      .select()
      .single();

    if (userError) throw userError;

    // Then create the staff details
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert([{
        user_id: user.id,
        firm_id: firmId,
        employee_id: staffData.employee_id,
        department: staffData.department,
        specializations: staffData.specializations,
        hourly_rate: staffData.hourly_rate,
        is_available: staffData.is_available,
      }])
      .select()
      .single();

    if (staffError) throw staffError;

    return {
      id: user.id,
      user_id: user.id,
      firm_id: user.firm_id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      employee_id: staff.employee_id,
      department: staff.department,
      specializations: staff.specializations,
      hourly_rate: staff.hourly_rate,
      is_available: staff.is_available,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    // Update user table
    const userUpdates: any = {};
    if (updates.name) userUpdates.full_name = updates.name;
    if (updates.email) userUpdates.email = updates.email;
    if (updates.phone) userUpdates.phone = updates.phone;
    if (updates.role) userUpdates.role = updates.role;
    if (updates.is_active !== undefined) userUpdates.is_active = updates.is_active;

    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ ...userUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (userError) throw userError;

    // Update staff table
    const staffUpdates: any = {};
    if (updates.employee_id) staffUpdates.employee_id = updates.employee_id;
    if (updates.department) staffUpdates.department = updates.department;
    if (updates.specializations) staffUpdates.specializations = updates.specializations;
    if (updates.hourly_rate) staffUpdates.hourly_rate = updates.hourly_rate;
    if (updates.is_available !== undefined) staffUpdates.is_available = updates.is_available;

    if (Object.keys(staffUpdates).length > 0) {
      await supabase
        .from('staff')
        .update({ ...staffUpdates, updated_at: new Date().toISOString() })
        .eq('user_id', id);
    }

    // Return updated staff data
    return this.getStaffById(id);
  }

  async getStaffById(id: string): Promise<Staff> {
    const staff = await this.getStaff();
    const found = staff.find(s => s.id === id);
    if (!found) throw new Error('Staff member not found');
    return found;
  }

  async deleteStaff(id: string): Promise<void> {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async importStaff(staffList: Omit<Staff, 'id' | 'user_id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Staff[]> {
    const results: Staff[] = [];

    // Process each staff member individually to handle the user/staff relationship
    for (const staffData of staffList) {
      try {
        const newStaff = await this.createStaff(staffData);
        results.push(newStaff);
      } catch (error) {
        console.error('Failed to import staff member:', staffData.name, error);
        // Continue with other staff members
      }
    }

    return results;
  }
}

export const staffService = new StaffService();