import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Task, TaskComment } from '../types';

import { devLog } from './logger';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface TaskChangePayload {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: Task;
    old?: { id: string };
}

export interface CommentChangePayload {
    eventType: 'INSERT';
    new: TaskComment;
}

type TaskChangeCallback = (payload: TaskChangePayload) => void;
type CommentChangeCallback = (payload: CommentChangePayload) => void;
type StatusChangeCallback = (status: ConnectionStatus) => void;

class RealtimeService {
    private tasksChannel: RealtimeChannel | null = null;
    private commentChannels: Map<string, RealtimeChannel> = new Map();
    private statusListeners: Set<StatusChangeCallback> = new Set();
    private currentStatus: ConnectionStatus = 'disconnected';
    private currentFirmId: string | null = null;

    /**
     * Subscribe to task changes for a firm
     */
    subscribeToTasks(firmId: string, onTaskChange: TaskChangeCallback): () => void {
        // If already subscribed to same firm, just return unsubscribe
        if (this.tasksChannel && this.currentFirmId === firmId) {
            devLog('Already subscribed to tasks for firm:', firmId);
            return () => this.unsubscribeFromTasks();
        }

        // Clean up any existing subscription
        this.unsubscribeFromTasks();
        this.currentFirmId = firmId;

        devLog('Subscribing to tasks for firm:', firmId);
        this.updateStatus('connecting');

        this.tasksChannel = supabase
            .channel(`tasks:${firmId} `)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `firm_id = eq.${firmId} `
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    devLog('Task change received:', payload.eventType, payload);

                    const changePayload: TaskChangePayload = {
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        new: payload.new as Task | undefined,
                        old: payload.old as { id: string } | undefined
                    };

                    onTaskChange(changePayload);
                }
            )
            .subscribe((status) => {
                devLog('Tasks channel status:', status);
                if (status === 'SUBSCRIBED') {
                    this.updateStatus('connected');
                } else if (status === 'CLOSED') {
                    this.updateStatus('disconnected');
                } else if (status === 'CHANNEL_ERROR') {
                    this.updateStatus('error');
                }
            });

        return () => this.unsubscribeFromTasks();
    }

    /**
     * Subscribe to comments for a specific task
     */
    subscribeToTaskComments(taskId: string, onCommentChange: CommentChangeCallback): () => void {
        // If already subscribed to this task, return existing unsubscribe
        if (this.commentChannels.has(taskId)) {
            devLog('Already subscribed to comments for task:', taskId);
            return () => this.unsubscribeFromTaskComments(taskId);
        }

        devLog('Subscribing to comments for task:', taskId);

        const channel = supabase
            .channel(`task_comments:${taskId} `)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'task_comments',
                    filter: `task_id = eq.${taskId} `
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    devLog('Comment change received:', payload);

                    // We only care about INSERTs for comments (new comments)
                    if (payload.eventType === 'INSERT') {
                        const changePayload: CommentChangePayload = {
                            eventType: 'INSERT',
                            new: payload.new as TaskComment
                        };
                        onCommentChange(changePayload);
                    }
                }
            )
            .subscribe((status) => {
                devLog('Comments channel status for task', taskId, ':', status);
            });

        this.commentChannels.set(taskId, channel);

        return () => this.unsubscribeFromTaskComments(taskId);
    }

    /**
     * Unsubscribe from task changes
     */
    private unsubscribeFromTasks(): void {
        if (this.tasksChannel) {
            devLog('Unsubscribing from tasks');
            supabase.removeChannel(this.tasksChannel);
            this.tasksChannel = null;
            this.currentFirmId = null;
        }
    }

    /**
     * Unsubscribe from a specific task's comments
     */
    private unsubscribeFromTaskComments(taskId: string): void {
        const channel = this.commentChannels.get(taskId);
        if (channel) {
            devLog('Unsubscribing from comments for task:', taskId);
            supabase.removeChannel(channel);
            this.commentChannels.delete(taskId);
        }
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll(): void {
        devLog('Unsubscribing from all channels');

        this.unsubscribeFromTasks();

        // Unsubscribe from all comment channels
        this.commentChannels.forEach((channel, taskId) => {
            devLog('Unsubscribing from comments for task:', taskId);
            supabase.removeChannel(channel);
        });
        this.commentChannels.clear();

        this.updateStatus('disconnected');
    }

    /**
     * Get current connection status
     */
    getConnectionStatus(): ConnectionStatus {
        return this.currentStatus;
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(callback: StatusChangeCallback): () => void {
        this.statusListeners.add(callback);
        // Immediately notify with current status
        callback(this.currentStatus);
        return () => {
            this.statusListeners.delete(callback);
        };
    }

    private updateStatus(status: ConnectionStatus): void {
        if (this.currentStatus !== status) {
            this.currentStatus = status;
            devLog('Status changed to:', status);
            this.statusListeners.forEach(listener => listener(status));
        }
    }
}

export const realtimeService = new RealtimeService();
