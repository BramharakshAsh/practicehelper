import { create } from 'zustand';
import { Task } from '../types';
import { tasksService } from '../services/tasks.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  hasFetched: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchTasksByStaff: (staffId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<void>;
  getTask: (id: string) => Task | undefined;
  createBulkTasks: (tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  importTasks: (tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  clearError: () => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoading: false,
  hasFetched: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const tasks = await tasksService.getTasks();
      set({ tasks, isLoading: false, hasFetched: true });
    }, 'Fetch tasks').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false,
        hasFetched: true
      });
    });
  },

  fetchTasksByStaff: async (staffId: string) => {
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const tasks = await tasksService.getTasksByStaff(staffId);
      set({ tasks, isLoading: false, hasFetched: true });
    }, 'Fetch tasks by staff').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false,
        hasFetched: true
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
      // Get the task before deleting to check for audit_id
      const state = useTasksStore.getState();
      const task = state.tasks.find(t => t.id === id);

      if (task?.audit_id) {
        // We import it dynamically or assume the service is available
        const { auditManagementService } = await import('../services/audit-management.service');
        await auditManagementService.deleteAuditPlan(task.audit_id);
      }

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

  bulkDeleteTasks: async (ids) => {
    if (ids.length === 0) return;

    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      await tasksService.bulkDeleteTasks(ids);
      set(state => ({
        tasks: state.tasks.filter(task => !ids.includes(task.id)),
        isLoading: false
      }));
    }, 'Bulk delete tasks').catch((error) => {
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

  getTask: (id: string): Task | undefined => {
    return useTasksStore.getState().tasks.find((t: Task) => t.id === id);
  },
  clearError: () => set({ error: null }),
}));