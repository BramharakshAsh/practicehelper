import { useEffect } from 'react';
import { useTasksStore } from '../store/tasks.store';
import { useAuthStore } from '../store/auth.store';
import { Task } from '../types';

export const useTasks = () => {
  const {
    tasks,
    archivedTasks,
    isLoading,
    isArchivedLoading,
    hasFetched,
    error,
    fetchUserTasks,
    fetchArchivedUserTasks,
    createTask,
    updateTask,
    deleteTask,
    createBulkTasks,
    importTasks,
    clearError,
  } = useTasksStore();

  const { user } = useAuthStore();

  useEffect(() => {
    if (!hasFetched && !isLoading && user) {
      fetchUserTasks();
    }
  }, [hasFetched, isLoading, user, fetchUserTasks]);

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>) => createTask(taskData);
  const handleUpdateTask = (id: string, updates: Partial<Task>) => updateTask(id, updates);
  const handleDeleteTask = (id: string) => deleteTask(id);
  const handleCreateBulkTasks = (tasksData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => createBulkTasks(tasksData);
  const handleImportTasks = (tasksData: Omit<Task, 'id' | 'firm_id' | 'created_at' | 'updated_at'>[]) => importTasks(tasksData);

  const refetch = () => {
    fetchUserTasks();
  };

  return {
    tasks,
    archivedTasks,
    isLoading,
    isArchivedLoading,
    error,
    fetchArchivedUserTasks,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    createBulkTasks: handleCreateBulkTasks,
    importTasks: handleImportTasks,
    refetch,
    clearError,
  };
};