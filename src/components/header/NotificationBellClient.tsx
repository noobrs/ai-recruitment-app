'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from '@/utils/utils';
import { createRealtimeClient } from '@/utils/supabase/realtime';

type Props = {
    userId: string;
    initialUnreadCount: number;
    initialNotifications: Notification[];
    hoverClass: string;
    iconClass: string;
};

export default function NotificationBellClient({
    userId,
    initialUnreadCount,
    initialNotifications,
    hoverClass,
    iconClass,
}: Props) {
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [showPreview, setShowPreview] = useState(false);
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle mouse enter with delay
    const handleMouseEnter = useCallback(() => {
        // Clear any pending hide timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        // Show preview after short delay
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setShowPreview(true);
        }, 200); // 200ms delay before showing preview
    }, []);

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
        // Clear show timeout if still pending
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Hide preview after short delay to allow moving to modal
        hideTimeoutRef.current = setTimeout(() => {
            setShowPreview(false);
        }, 150);
    }, []);

    // Set up real-time subscription
    useEffect(() => {
        const supabaseRealtime = createRealtimeClient();

        // Use a unique channel name for this user to avoid conflicts
        const channelName = `notification-bell-${userId}`;

        console.log('[NotificationBell] Setting up realtime subscription for user:', userId);

        const channel = supabaseRealtime
            .channel(channelName, {
                config: {
                    broadcast: { self: true },
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
                    console.log('[NotificationBell] New notification received:', payload);
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]); // Keep only latest 5
                    setUnreadCount((prev) => prev + 1);
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
                    console.log('[NotificationBell] Notification updated:', payload);
                    const updatedNotification = payload.new as Notification;
                    const oldNotification = payload.old as Notification;

                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.notification_id === updatedNotification.notification_id
                                ? updatedNotification
                                : n
                        )
                    );

                    // Update unread count if opened_at changed
                    if (!oldNotification.opened_at && updatedNotification.opened_at) {
                        setUnreadCount((prev) => Math.max(0, prev - 1));
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
                    console.log('[NotificationBell] Notification deleted:', payload);
                    const deletedNotification = payload.old as Notification;
                    setNotifications((prev) =>
                        prev.filter((n) => n.notification_id !== deletedNotification.notification_id)
                    );
                    if (!deletedNotification.opened_at) {
                        setUnreadCount((prev) => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('[NotificationBell] Subscription status:', status, err);
                if (status === 'SUBSCRIBED') {
                    console.log('[NotificationBell] ✅ Successfully subscribed to notifications');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[NotificationBell] ❌ Channel error:', err);
                } else if (status === 'TIMED_OUT') {
                    console.error('[NotificationBell] ❌ Subscription timed out');
                } else if (status === 'CLOSED') {
                    console.log('[NotificationBell] ⚠️ Channel closed');
                }
            });

        return () => {
            console.log('[NotificationBell] Cleaning up subscription');
            supabaseRealtime.removeChannel(channel);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [userId]);

    // Navigate to notification page with specific notification
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.opened_at) {
            const supabase = createClient();
            await supabase
                .from('notification')
                .update({ opened_at: new Date().toISOString() })
                .eq('notification_id', notification.notification_id);
        }

        setShowPreview(false);
        router.push(`/notifications?id=${notification.notification_id}`);
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                aria-label="Notifications"
                className={`relative p-2 rounded-full transition-colors ${hoverClass}`}
                onClick={() => router.push('/notifications')}
            >
                <svg
                    className={`w-6 h-6 ${iconClass}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Preview Modal */}
            {showPreview && (
                <div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <svg
                                    className="w-12 h-12 mx-auto mb-2 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.notification_id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${!notification.opened_at ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        {!notification.opened_at && (
                                            <div className="mt-2 w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm line-clamp-2 mb-1 ${!notification.opened_at ? 'font-semibold text-gray-900' : 'text-gray-700'
                                                }`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDistanceToNow(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200">
                        <button
                            onClick={() => {
                                setShowPreview(false);
                                router.push('/notifications');
                            }}
                            className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
