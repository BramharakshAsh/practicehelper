import { supabase } from './supabase';
import { Task } from '../types';

class TasksService {
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients!tasks_client_id_fkey(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTasksByStaff(staffId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients!tasks_client_id_fkey(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createTask(task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const firmId = 'demo-firm-id'; // This should be dynamic based on authenticated user
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, firm_id: firmId }])
      .select(`
        *,
        client:clients!tasks_client_id_fkey(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        client:clients!tasks_client_id_fkey(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async createBulkTasks(tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    const firmId = 'demo-firm-id'; // This should be dynamic based on authenticated user
    
    const tasksWithFirm = tasks.map(task => ({ ...task, firm_id: firmId }));
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksWithFirm)
      .select(`
        *,
        client:clients!tasks_client_id_fkey(*),
        staff:users!tasks_staff_id_fkey(*),
        compliance_type:compliance_types(*)
      `);

    if (error) throw error;
    return data || [];
  }

  async importTasks(tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    return this.createBulkTasks(tasks);
  }
}

export const tasksService = new TasksService();