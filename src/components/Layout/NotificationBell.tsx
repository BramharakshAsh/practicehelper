import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { notificationsService, Notification } from '../../services/notifications.service';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const data = await notificationsService.getUnreadNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationsService.markAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setLoading(true);
            await notificationsService.markAllAsRead();
            setNotifications([]);
            setLoading(false);
        } catch (error) {
            console.error('Error marking all read', error);
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read and navigate
        await notificationsService.markAsRead(notification.id);
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setIsOpen(false);

        if (notification.related_entity_type === 'task' && notification.related_entity_id) {
            navigate('/dashboard/tasks');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all border border-gray-100 relative"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center"
                                disabled={loading}
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300 opacity-50" />
                                <p className="text-sm">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group relative"
                                    >
                                        <div className="pr-6">
                                            <p className="text-sm font-medium text-gray-900 mb-1">{notification.title}</p>
                                            {notification.message && (
                                                <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-blue-50 rounded-full"
                                            title="Mark as read"
                                        >
                                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
