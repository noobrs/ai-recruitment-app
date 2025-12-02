'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Notification } from '@/types';
import { createRealtimeClient } from '@/utils/supabase/realtime';

type Props = {
    userId: string;
    initialUnreadCount: number;
    hoverClass: string;
    iconClass: string;
};

export default function NotificationBell({
    userId,
    initialUnreadCount,
    hoverClass,
    iconClass,
}: Props) {
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const router = useRouter();
    const pathname = usePathname();
    const isOnNotificationPage = pathname === '/notifications';

    // Set up real-time subscription for unread count only
    useEffect(() => {
        const supabaseRealtime = createRealtimeClient();

        // Use a unique channel name for this user to avoid conflicts
        const channelName = `notifications-bell-${userId}`;
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
                () => {
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
                    const updatedNotification = payload.new as Notification;
                    const oldNotification = payload.old as Notification;

                    // Update unread count if opened_at changed
                    if (!oldNotification.opened_at && updatedNotification.opened_at) {
                        setUnreadCount((prev) => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();

        return () => {
            supabaseRealtime.removeChannel(channel);
        };
    }, [userId]);

    // Navigate directly to notifications page
    const handleBellClick = () => {
        router.push('/notifications');
    };

    return (
        <button
            type="button"
            aria-label="Notifications"
            className={`relative p-2 rounded-full transition-colors ${hoverClass}`}
            onClick={handleBellClick}
        >
            <svg
                className={`w-6 h-6 ${iconClass}`}
                fill={isOnNotificationPage ? "currentColor" : "none"}
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
    );
}
