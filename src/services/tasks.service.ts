import { Task } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

// Helper to map DB response to Task type
// The query returns 'staff' as a User object (from users table), but Task interface expects Staff object.
// We map full_name to name to satisfy the UI requirement.
const mapDBTask = (task: any): Task => ({
  ...task,
  staff: task.staff ? {
    ...task.staff,
    name: task.staff.full_name || task.staff.name,
    // If needed, we can map other fields, but name is critical for display
  } : undefined
});

class TasksService {
  async getTasks(): Promise<Task[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .eq('firm_id', firmId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapDBTask);
  }

  async getTasksByStaff(staffId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .eq('staff_id', staffId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapDBTask);
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
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .single();

    if (error) throw error;
    return mapDBTask(data);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .single();

    if (error) throw error;
    return mapDBTask(data);
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

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
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `);

    if (error) throw error;
    return (data || []).map(mapDBTask);
  }

  async importTasks(tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    return this.createBulkTasks(tasks);
  }
}

export const tasksService = new TasksService();
