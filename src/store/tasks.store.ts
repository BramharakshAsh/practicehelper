import { create } from 'zustand';
import { Task } from '../types';
import { tasksService } from '../services/tasks.service';
import { useAuthStore } from './auth.store';
import { ErrorService, handleAsyncError } from '../services/error.service';
import { devLog } from '../services/logger';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  hasFetched: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchUserTasks: () => Promise<void>; // Smart fetch based on role
  fetchTasksByStaff: (staffId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<void>;
  getTask: (id: string) => Task | undefined;
  createBulkTasks: (tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  importTasks: (tasks: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  clearError: () => void;

  // Realtime sync actions (apply changes from other clients)
  applyRealtimeInsert: (task: Task) => void;
  applyRealtimeUpdate: (task: Task) => void;
  applyRealtimeDelete: (taskId: string) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoading: false,
  hasFetched: false,
  error: null,

  fetchTasks: async () => {
    devLog('[TasksStore] fetchTasks called');
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const tasks = await tasksService.getTasks();
      devLog('[TasksStore] fetchTasks success, count:', tasks.length);
      set({ tasks, isLoading: false, hasFetched: true });
    }, 'Fetch tasks').catch((error) => {
      set({
        error: ErrorService.getErrorMessage(error),
        isLoading: false,
        hasFetched: true
      });
    });
  },

  fetchUserTasks: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    devLog('[TasksStore] fetchUserTasks called for user:', user.email, 'role:', user.role);

    // Use the same role check as useTasks hook
    if (['staff', 'paid_staff', 'articles'].includes(user.role)) {
      devLog('[TasksStore] fetchUserTasks: Routing to fetchTasksByStaff');
      await useTasksStore.getState().fetchTasksByStaff(user.id);
    } else {
      devLog('[TasksStore] fetchUserTasks: Routing to fetchTasks (All)');
      await useTasksStore.getState().fetchTasks();
    }
  },

  fetchTasksByStaff: async (staffId: string) => {
    devLog('[TasksStore] fetchTasksByStaff called, staffId:', staffId);
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const tasks = await tasksService.getTasksByStaff(staffId);
      devLog('[TasksStore] fetchTasksByStaff success, count:', tasks.length);
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
    devLog('[TasksStore] createTask called');
    set({ isLoading: true, error: null });

    await handleAsyncError(async () => {
      const newTask = await tasksService.createTask(taskData);
      devLog('[TasksStore] createTask success:', newTask.id);
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
    devLog('[TasksStore] updateTask called, id:', id);
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
    devLog('[TasksStore] deleteTask called, id:', id);
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
    devLog('[TasksStore] bulkDeleteTasks called, count:', ids.length);

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
    devLog('[TasksStore] createBulkTasks called, count:', tasksData.length);
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
    devLog('[TasksStore] importTasks called, count:', tasksData.length);
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

  // Realtime sync actions - apply changes from other clients without API calls
  applyRealtimeInsert: (task: Task) => {
    devLog('[TasksStore] applyRealtimeInsert:', task.id);
    set(state => {
      if (state.tasks.some(t => t.id === task.id)) {
        return state;
      }
      return { tasks: [task, ...state.tasks] };
    });
  },

  applyRealtimeUpdate: (task: Task) => {
    devLog('[TasksStore] applyRealtimeUpdate:', task.id);
    set(state => ({
      tasks: state.tasks.map(t => t.id === task.id ? task : t)
    }));
  },

  applyRealtimeDelete: (taskId: string) => {
    devLog('[TasksStore] applyRealtimeDelete:', taskId);
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId)
    }));
  },
}));