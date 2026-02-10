import { create } from 'zustand';
import { TaskComment } from '../types';
import { taskCommentsService } from '../services/task-comments.service';
import { ErrorService, handleAsyncError } from '../services/error.service';
import { devLog, devError } from '../services/logger';

interface TaskCommentsState {
    comments: { [taskId: string]: TaskComment[] }; // Map taskId to comments
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchComments: (taskId: string) => Promise<void>;
    addComment: (taskId: string, content: string) => Promise<void>;
    clearError: () => void;

    // Realtime sync actions
    applyRealtimeInsert: (taskId: string, comment: TaskComment) => void;
}

export const useTaskCommentsStore = create<TaskCommentsState>((set) => ({
    comments: {},
    isLoading: false,
    error: null,

    fetchComments: async (taskId) => {
        devLog('[CommentsStore] fetchComments called, taskId:', taskId);

        await handleAsyncError(async () => {
            const taskComments = await taskCommentsService.getComments(taskId);
            devLog('[CommentsStore] fetchComments success, count:', taskComments.length);
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
            devError('[CommentsStore] Failed to fetch comments', error);
        });
    },

    addComment: async (taskId, content) => {
        devLog('[CommentsStore] addComment called, taskId:', taskId);
        set({ isLoading: true, error: null });

        await handleAsyncError(async () => {
            const newComment = await taskCommentsService.createComment(taskId, content);
            devLog('[CommentsStore] addComment success:', newComment.id);
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

    // Realtime sync action - apply comment from other clients without API call
    applyRealtimeInsert: (taskId: string, comment: TaskComment) => {
        devLog('[CommentsStore] applyRealtimeInsert, taskId:', taskId, 'commentId:', comment.id);
        set(state => {
            const existingComments = state.comments[taskId] || [];
            // Avoid duplicates
            if (existingComments.some(c => c.id === comment.id)) {
                return state;
            }
            return {
                comments: {
                    ...state.comments,
                    [taskId]: [...existingComments, comment]
                }
            };
        });
    },
}));
