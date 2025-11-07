'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Notification } from '@/types';
import NotificationList from './NotificationList';
import NotificationDetail from './NotificationDetail';
import toast from 'react-hot-toast';
import { createRealtimeClient } from '@/utils/supabase/realtime';
import { markAsRead as markAsReadAction, markAllAsRead as markAllAsReadAction } from '@/app/notifications/actions';

type Props = {
    userId: string;
    initialNotifications: Notification[];
};

export default function NotificationsClient({ userId, initialNotifications }: Props) {
    const searchParams = useSearchParams();
    const notificationIdFromUrl = searchParams.get('id');

    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Handle URL parameter changes - select notification when ID is in URL
    useEffect(() => {
        if (notificationIdFromUrl) {
            const targetId = parseInt(notificationIdFromUrl);
            const targetNotification = notifications.find(n => n.notification_id === targetId);

            if (targetNotification && targetNotification.notification_id !== selectedNotification?.notification_id) {
                setSelectedNotification(targetNotification);
            }
        } else if (!selectedNotification && notifications.length > 0) {
            // If no URL param and nothing selected, select first notification
            setSelectedNotification(notifications[0]);
        }
    }, [notificationIdFromUrl, notifications, selectedNotification]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            const result = await markAsReadAction(notificationId);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Update local state
            if (result.data) {
                setNotifications((prev) =>
                    prev.map((n) => (n.notification_id === notificationId ? result.data! : n))
                );

                // Update selected notification if it's the one being marked
                if (selectedNotification?.notification_id === notificationId) {
                    setSelectedNotification(result.data);
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    }, [selectedNotification]);

    // Mark notification as read when selected from URL
    useEffect(() => {
        if (selectedNotification && !selectedNotification.opened_at && notificationIdFromUrl) {
            markAsRead(selectedNotification.notification_id);
        }
    }, [selectedNotification, notificationIdFromUrl, markAsRead]);

    // Handle notification click
    const handleNotificationClick = useCallback((notification: Notification) => {
        setSelectedNotification(notification);

        // Mark as read if it hasn't been opened yet
        if (!notification.opened_at) {
            markAsRead(notification.notification_id);
        }
    }, [markAsRead]);

    // Set up real-time subscription
    useEffect(() => {
        const supabaseRealtime = createRealtimeClient();

        // Subscribe to new notifications
        const channelName = `notifications-list-${userId}`;
        const channel = supabaseRealtime
            .channel(channelName, {
                config: {
                    broadcast: { self: false },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;

                    // Add to the beginning of the list
                    setNotifications((prev) => [newNotification, ...prev]);

                    // If URL has this notification ID, it will be auto-selected by the URL effect
                    // The URL parameter effect will handle selecting it
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notification',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const updatedNotification = payload.new as Notification;

                    // Update in the list
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.notification_id === updatedNotification.notification_id
                                ? updatedNotification
                                : n
                        )
                    );

                    // Update selected if it's the current one
                    if (selectedNotification?.notification_id === updatedNotification.notification_id) {
                        setSelectedNotification(updatedNotification);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notification',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const deletedId = (payload.old as Notification).notification_id;

                    // Remove from list
                    setNotifications((prev) =>
                        prev.filter((n) => n.notification_id !== deletedId)
                    );

                    // Clear selected if it was deleted
                    if (selectedNotification?.notification_id === deletedId) {
                        setSelectedNotification(notifications[0] || null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabaseRealtime.removeChannel(channel);
        };
    }, [userId, selectedNotification, notifications, handleNotificationClick]);

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        setIsLoading(true);
        try {
            const result = await markAllAsReadAction(userId);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Update local state
            const now = new Date().toISOString();
            setNotifications((prev) =>
                prev.map((n) => (n.opened_at ? n : { ...n, opened_at: now }))
            );

            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-12rem)]">
            {/* Left column - Notification list */}
            <div className="w-1/3 min-w-[320px]">
                <NotificationList
                    notifications={notifications}
                    selectedId={selectedNotification?.notification_id}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    isLoading={isLoading}
                />
            </div>

            {/* Right column - Notification detail */}
            <div className="flex-1">
                <NotificationDetail notification={selectedNotification} />
            </div>
        </div>
    );
}
