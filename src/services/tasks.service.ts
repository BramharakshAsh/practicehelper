import { Task } from '../types';
import { useAuthStore } from '../store/auth.store';
import { LocalStorageService } from './local-storage.service';
import { clientsService } from './clients.service';
import { staffService } from './staff.service';
import { complianceService } from './compliance.service';

const TASKS_KEY = 'ca_practice_manager_tasks';

class TasksService {
  async getTasks(): Promise<Task[]> {
    const tasks = LocalStorageService.getItem<Task[]>(TASKS_KEY, []);
    const clients = await clientsService.getClients();
    const staff = await staffService.getStaff();
    const complianceTypes = await complianceService.getComplianceTypes();

    // Map relationships manually to maintain UI compatibility
    return tasks.map(task => ({
      ...task,
      client: clients.find(c => c.id === task.client_id),
      staff: staff.find(s => s.id === task.staff_id),
      compliance_type: complianceTypes.find(ct => ct.id === task.compliance_type_id),
    }));
  }

  async getTasksByStaff(staffId: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.filter(t => t.staff_id === staffId);
  }

  async createTask(task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const tasks = LocalStorageService.getItem<Task[]>(TASKS_KEY, []);
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      firm_id: firmId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    tasks.push(newTask);
    LocalStorageService.setItem(TASKS_KEY, tasks);

    // Return with joined data
    const clients = await clientsService.getClients();
    const staff = await staffService.getStaff();
    const complianceTypes = await complianceService.getComplianceTypes();
    return {
      ...newTask,
      client: clients.find(c => c.id === newTask.client_id),
      staff: staff.find(s => s.id === newTask.staff_id),
      compliance_type: complianceTypes.find(ct => ct.id === newTask.compliance_type_id),
    };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = LocalStorageService.getItem<Task[]>(TASKS_KEY, []);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Task not found');

    const updatedTask = {
      ...tasks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    tasks[index] = updatedTask;
    LocalStorageService.setItem(TASKS_KEY, tasks);

    // Return with joined data
    const clients = await clientsService.getClients();
    const staff = await staffService.getStaff();
    const complianceTypes = await complianceService.getComplianceTypes();
    return {
      ...updatedTask,
      client: clients.find(c => c.id === updatedTask.client_id),
      staff: staff.find(s => s.id === updatedTask.staff_id),
      compliance_type: complianceTypes.find(ct => ct.id === updatedTask.compliance_type_id),
    };
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = LocalStorageService.getItem<Task[]>(TASKS_KEY, []);
    const filtered = tasks.filter(t => t.id !== id);
    LocalStorageService.setItem(TASKS_KEY, filtered);
  }

  async createBulkTasks(tasksData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const currentTasks = LocalStorageService.getItem<Task[]>(TASKS_KEY, []);
    const newTasks = tasksData.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      firm_id: firmId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const updatedTasks = [...currentTasks, ...newTasks];
    LocalStorageService.setItem(TASKS_KEY, updatedTasks);

    // Return with joined data (though usually bulk creations might not need full join immediately, 
    // the store might expect it)
    const clients = await clientsService.getClients();
    const staff = await staffService.getStaff();
    const complianceTypes = await complianceService.getComplianceTypes();
    return newTasks.map(t => ({
      ...t,
      client: clients.find(c => c.id === t.client_id),
      staff: staff.find(s => s.id === t.staff_id),
      compliance_type: complianceTypes.find(ct => ct.id === t.compliance_type_id),
    }));
  }

  async importTasks(tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    return this.createBulkTasks(tasks);
  }
}

export const tasksService = new TasksService();
