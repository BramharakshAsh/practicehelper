import { Task, UserRole, User } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

import { DBTaskResponse } from '../types/database.types';

const mapDBTask = (task: DBTaskResponse): Task => {
  return {
    ...task,
    staff: task.staff ? {
      id: task.staff.id,
      user_id: task.staff.id,
      firm_id: task.firm_id,
      name: task.staff.full_name || '',
      email: task.staff.email,
      role: task.staff.role as UserRole,
      is_active: true,
      specializations: [],
      is_available: true,
      created_at: '', // These will be populated by the record itself if needed
      updated_at: ''
    } : undefined,
    creator: task.creator ? {
      ...task.creator,
      full_name: task.creator.full_name || '',
      firm_id: task.firm_id,
      is_active: true,
      created_at: '',
      updated_at: ''
    } as User : undefined
  };
};

class TasksService {
  async getTasks(): Promise<Task[]> {
    const user = useAuthStore.getState().user;
    const firmId = user?.firm_id;
    if (!firmId) return [];

    let query = supabase
      .from('tasks')
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(id, full_name, role, email),
        creator:users!tasks_assigned_by_fkey(id, full_name, role, email),
        compliance_type:compliance_types(*

)
      `)
      .eq('firm_id', firmId);

    if (user.role === 'manager') {
      const { data: staffIds } = await supabase.from('staff').select('user_id').eq('manager_id', user.id);
      const { data: clientIds } = await supabase.from('clients').select('id').eq('manager_id', user.id);

      const sIds = (staffIds || []).map(s => s.user_id);
      const cIds = (clientIds || []).map(c => c.id);
      sIds.push(user.id);

      query = query.or(`staff_id.in.(${sIds.join(',')}),client_id.in.(${cIds.join(',')})`);
    } else if (user.role !== 'partner') {
      query = query.eq('staff_id', user.id);
    }

    const { data, error } = await (query as any).order('due_date', { ascending: true });

    if (error) throw error;

    const typedData = (data as unknown as DBTaskResponse[]) || [];

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const filteredData = typedData.filter(task => {
      if (task.status === 'filed_completed') {
        // Only show completed tasks if they were updated in the last 12 hours
        return task.updated_at >= twelveHoursAgo;
      }
      return true;
    });

    return filteredData.map(mapDBTask);
  }

  async getTasksByStaff(staffId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(id, full_name, role, email),
        creator:users!tasks_assigned_by_fkey(id, full_name, role, email),
        compliance_type:compliance_types(*)
      `)
      .eq('staff_id', staffId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return ((data as unknown as DBTaskResponse[]) || []).map(mapDBTask);
  }

  async createTask(task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        firm_id: firmId,
      })
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(id, full_name, role, email),
        creator:users!tasks_assigned_by_fkey(id, full_name, role, email),
        compliance_type:compliance_types(*)
      `)
      .single();

    if (error) throw error;
    return mapDBTask(data as unknown as DBTaskResponse);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { client, staff, creator, compliance_type, ...cleanUpdates } = updates;

    const { data, error } = await supabase
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(id, full_name, role, email),
        creator:users!tasks_assigned_by_fkey(id, full_name, role, email),
        compliance_type:compliance_types(*)
      `)
      .single();

    if (error) throw error;
    return mapDBTask(data as unknown as DBTaskResponse);
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async bulkDeleteTasks(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  async createBulkTasks(tasksData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksData.map(t => ({ ...t, firm_id: firmId })))
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(id, full_name, role, email),
        creator:users!tasks_assigned_by_fkey(id, full_name, role, email),
        compliance_type:compliance_types(*)
      `);

    if (error) throw error;
    return ((data as unknown as DBTaskResponse[]) || []).map(mapDBTask);
  }

  async importTasks(tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    return this.createBulkTasks(tasks);
  }
}

export const tasksService = new TasksService();
