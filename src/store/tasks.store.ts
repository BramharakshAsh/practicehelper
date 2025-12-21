import { create } from 'zustand';
import { Task } from '../types';
import { tasksService } from '../services/tasks.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  fetchTasksByStaff: (staffId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createBulkTasks: (tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  importTasks: (tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  clearError: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    
    await handleAsyncError(async () => {
      const tasks = await tasksService.getTasks();
      set({ tasks, isLoading: false });
    }, 'Fetch tasks').catch((error) => {
      set({ 
        error: ErrorService.getErrorMessage(error),
        isLoading: false 
      });
    });
  },

  fetchTasksByStaff: async (staffId: string) => {
    set({ isLoading: true, error: null });
    
    await handleAsyncError(async () => {
      const tasks = await tasksService.getTasksByStaff(staffId);
      set({ tasks, isLoading: false });
    }, 'Fetch tasks by staff').catch((error) => {
      set({ 
        error: ErrorService.getErrorMessage(error),
        isLoading: false 
      });
    });
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    
    await handleAsyncError(async () => {
      const newTask = await tasksService.createTask(taskData);
      set(state => ({ 
        tasks: [newTask, ...state.tasks],
        isLoading: false 
      }));
    }, 'Create task').catch((error) => {
      set({ 
        error: ErrorService.getErrorMessage(error),
        isLoading: false 
      });
      throw error;
    });
  },

  updateTask: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    await handleAsyncError(async () => {
      const updatedTask = await tasksService.updateTask(id, updates);
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id ? updatedTask : task
        ),
        isLoading: false
      }));
    }, 'Update task').catch((error) => {
      set({ 
        error: ErrorService.getErrorMessage(error),
        isLoading: false 
      });
      throw error;
    });
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    
    await handleAsyncError(async () => {
      await tasksService.deleteTask(id);
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        isLoading: false
      }));
    }, 'Delete task').catch((error) => {
      set({ 
        error: ErrorService.getErrorMessage(error),
        isLoading: false 
      });
      throw error;
    });
  },

  createBulkTasks: async (tasksData) => {
    set({ isLoading: true, error: null });
    
    await handleAsyncError(async () => {
      const newTasks = await tasksService.createBulkTasks(tasksData);
      set(state => ({ 
        tasks: [...newTasks, ...state.tasks],
        isLoading: false 
      }));
    }, 'Create bulk tasks').catch((error) => {
      set({ 
        error: ErrorService.getErrorMessage(error),
        isLoading: false 
      });
      throw error;
    });
  },

  importTasks: async (tasksData) => {
    set({ isLoading: true, error: null });
    
    await handleAsyncError(async () => {
      const newTasks = await tasksService.importTasks(tasksData);
      set(state => ({ 
        tasks: [...newTasks, ...state.tasks],
        isLoading: false 
      }));
    }, 'Import tasks').catch((error) => {
      set({ 
        error: ErrorService.getErrorMessage(error),
        isLoading: false 
      });
      throw error;
    });
  },

  clearError: () => set({ error: null }),
}));