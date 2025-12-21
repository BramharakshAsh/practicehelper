import { useEffect } from 'react';
import { useTasksStore } from '../store/tasks.store';
import { useAuthStore } from '../store/auth.store';
import { Task } from '../types';

export const useTasks = () => {
  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    fetchTasksByStaff,
    createTask,
    updateTask,
    deleteTask,
    createBulkTasks,
    importTasks,
    clearError,
  } = useTasksStore();

  const { user } = useAuthStore();

  useEffect(() => {
    if (tasks.length === 0 && !isLoading && user) {
      if (user.role === 'staff') {
        fetchTasksByStaff(user.id);
      } else {
        fetchTasks();
      }
    }
  }, [tasks.length, isLoading, user, fetchTasks, fetchTasksByStaff]);

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => {
    try {
      await createTask(taskData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await updateTask(id, updates);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleCreateBulkTasks = async (tasksData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      await createBulkTasks(tasksData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const handleImportTasks = async (tasksData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      await importTasks(tasksData);
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  };

  const refetch = () => {
    if (user?.role === 'staff') {
      fetchTasksByStaff(user.id);
    } else {
      fetchTasks();
    }
  };

  return {
    tasks,
    isLoading,
    error,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    createBulkTasks: handleCreateBulkTasks,
    importTasks: handleImportTasks,
    refetch,
    clearError,
  };
};