import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useTasksStore } from '../store/tasks.store';
import { useTaskCommentsStore } from '../store/task-comments.store';
import { realtimeService, ConnectionStatus, TaskChangePayload, CommentChangePayload } from '../services/realtime.service';
import { taskCommentsService } from '../services/task-comments.service';

import { devLog } from '../services/logger';

interface UseRealtimeSubscriptionResult {
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
}

/**
 * Hook to manage Supabase Realtime subscriptions for tasks
 * Automatically subscribes when user is authenticated and unsubscribes on logout
 */
export function useRealtimeSubscription(): UseRealtimeSubscriptionResult {
    const user = useAuthStore(state => state.user);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Get store actions for applying realtime changes
    const applyTaskDelete = useTasksStore(state => state.applyRealtimeDelete);
    const fetchTasks = useTasksStore(state => state.fetchUserTasks);

    // Debounce refetch: batch rapid-fire changes into a single refetch
    const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFetchingRef = useRef(false);

    const debouncedRefetch = useCallback(() => {
        // Clear any pending refetch
        if (refetchTimerRef.current) {
            clearTimeout(refetchTimerRef.current);
        }

        // Schedule a refetch after 1 second of quiet
        refetchTimerRef.current = setTimeout(async () => {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;

            try {
                devLog('Debounced refetch: fetching all tasks');
                await fetchTasks();
            } catch (error) {
                devLog('Error during debounced refetch:', error);
            } finally {
                isFetchingRef.current = false;
            }
        }, 1000);
    }, [fetchTasks]);

    // Handle task changes from realtime
    const handleTaskChange = useCallback(async (payload: TaskChangePayload) => {
        devLog('Handling task change:', payload.eventType);

        if (payload.eventType === 'DELETE') {
            // DELETE is instant — just remove from local store
            if (payload.old?.id) {
                applyTaskDelete(payload.old.id);
            }
        } else {
            // INSERT and UPDATE: debounce into a single refetch
            debouncedRefetch();
        }
    }, [applyTaskDelete, debouncedRefetch]);

    // Subscribe to tasks when user is authenticated
    useEffect(() => {
        const firmId = user?.firm_id;

        if (!firmId) {
            devLog('No firm_id, not subscribing');
            realtimeService.unsubscribeAll();
            return;
        }

        devLog('User authenticated, subscribing to tasks for firm:', firmId);

        // Subscribe to tasks
        unsubscribeRef.current = realtimeService.subscribeToTasks(firmId, handleTaskChange);

        // Listen for status changes
        const unsubscribeStatus = realtimeService.onStatusChange(setConnectionStatus);

        return () => {
            devLog('Cleaning up task subscription');
            unsubscribeRef.current?.();
            unsubscribeStatus();
            // Clear pending debounce timer on cleanup
            if (refetchTimerRef.current) {
                clearTimeout(refetchTimerRef.current);
            }
        };
    }, [user?.firm_id, handleTaskChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            devLog('Component unmounting, cleaning up all subscriptions');
            realtimeService.unsubscribeAll();
            if (refetchTimerRef.current) {
                clearTimeout(refetchTimerRef.current);
            }
        };
    }, []);

    return {
        isConnected: connectionStatus === 'connected',
        connectionStatus
    };
}

/**
 * Hook to subscribe to comments for a specific task
 * Use this in task detail views to get real-time comment updates
 */
export function useTaskCommentsSubscription(taskId: string | null): void {
    const applyCommentInsert = useTaskCommentsStore(state => state.applyRealtimeInsert);

    const handleCommentChange = useCallback(async (payload: CommentChangePayload) => {
        devLog('Handling comment change for task:', taskId);

        if (payload.eventType === 'INSERT' && taskId) {
            // Fetch the comment with user info since realtime only gives raw data
            try {
                const comments = await taskCommentsService.getComments(taskId);
                const newComment = comments.find(c => c.id === payload.new.id);
                if (newComment) {
                    applyCommentInsert(taskId, newComment);
                }
            } catch (error) {
                devLog('Error fetching full comment:', error);
            }
        }
    }, [taskId, applyCommentInsert]);

    useEffect(() => {
        if (!taskId) return;

        devLog('Subscribing to comments for task:', taskId);
        const unsubscribe = realtimeService.subscribeToTaskComments(taskId, handleCommentChange);

        return () => {
            devLog('Unsubscribing from comments for task:', taskId);
            unsubscribe();
        };
    }, [taskId, handleCommentChange]);
}
