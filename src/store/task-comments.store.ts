import { create } from 'zustand';
import { TaskComment } from '../types';
import { taskCommentsService } from '../services/task-comments.service';
import { ErrorService, handleAsyncError } from '../services/error.service';

interface TaskCommentsState {
    comments: { [taskId: string]: TaskComment[] }; // Map taskId to comments
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchComments: (taskId: string) => Promise<void>;
    addComment: (taskId: string, content: string) => Promise<void>;
    clearError: () => void;
}

export const useTaskCommentsStore = create<TaskCommentsState>((set) => ({
    comments: {},
    isLoading: false,
    error: null,

    fetchComments: async (taskId) => {
        // Don't set global loading as we might be fetching for just one task
        // Or we could have refined loading states. For now, simple.
        // set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
            const taskComments = await taskCommentsService.getComments(taskId);
            set(state => ({
                comments: {
                    ...state.comments,
                    [taskId]: taskComments
                },
                // isLoading: false 
            }));
        }, 'Fetch comments').catch((error) => {
            // set({ 
            //   error: ErrorService.getErrorMessage(error),
            //   isLoading: false 
            // });
            console.error('Failed to fetch comments', error);
        });
    },

    addComment: async (taskId, content) => {
        set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
            const newComment = await taskCommentsService.createComment(taskId, content);
            set(state => {
                const existingComments = state.comments[taskId] || [];
                return {
                    comments: {
                        ...state.comments,
                        [taskId]: [...existingComments, newComment]
                    },
                    isLoading: false
                };
            });
        }, 'Add comment').catch((error) => {
            set({
                error: ErrorService.getErrorMessage(error),
                isLoading: false
            });
            throw error;
        });
    },

    clearError: () => set({ error: null }),
}));
