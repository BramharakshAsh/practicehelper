import * as React from 'react';
const { useEffect, useState } = React;
import { Send } from 'lucide-react';
import { useTaskCommentsStore } from '../../store/task-comments.store';
import { useAuthStore } from '../../store/auth.store';
import { useTaskCommentsSubscription } from '../../hooks/useRealtimeSubscription';

interface TaskCommentsProps {
    taskId: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
    const { comments, fetchComments, addComment, isLoading } = useTaskCommentsStore();
    const { user } = useAuthStore();
    const [newComment, setNewComment] = useState('');

    const taskComments = comments[taskId] || [];

    // Subscribe to real-time comment updates for this task
    useTaskCommentsSubscription(taskId);

    useEffect(() => {
        fetchComments(taskId);
    }, [taskId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await addComment(taskId, newComment);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Comments & Updates</h3>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-[300px] min-h-[200px] p-2 bg-gray-50 rounded-lg">
                {taskComments.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No comments yet.</p>
                ) : (
                    taskComments.map((comment) => (
                        <div
                            key={comment.id}
                            className={`flex flex-col ${comment.user_id === user?.id ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-lg p-3 ${comment.user_id === user?.id
                                    ? 'bg-blue-100 text-blue-900 rounded-tr-none'
                                    : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                                    }`}
                            >
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-semibold">
                                        {comment.user?.full_name || 'Unknown User'}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write an update..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || isLoading}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};

export default TaskComments;
