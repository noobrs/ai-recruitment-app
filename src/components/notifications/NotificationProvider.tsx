'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { Notification } from '@/types';
import { createRealtimeClient } from '@/utils/supabase/realtime';

type Props = {
    userId: string;
};

export default function NotificationProvider({ userId }: Props) {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        const supabaseRealtime = createRealtimeClient();

        // Subscribe to new notifications for toast display
        const channel = supabaseRealtime
            .channel('global-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const notification = payload.new as Notification;

                    // Show toast notification at bottom right
                    toast(
                        (t) => (
                            <div
                                className="cursor-pointer"
                                onClick={async () => {
                                    toast.dismiss(t.id);

                                    // Mark as read
                                    await supabase
                                        .from('notification')
                                        .update({ opened_at: new Date().toISOString() })
                                        .eq('notification_id', notification.notification_id);

                                    // Navigate to notifications page
                                    router.push(`/notifications?id=${notification.notification_id}`);
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-primary"
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
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm mb-1">
                                            New Notification
                                        </p>
                                        <p className="text-sm text-gray-700 line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ),
                        {
                            duration: 6000,
                            position: 'bottom-right',
                            style: {
                                maxWidth: '400px',
                            },
                        }
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, router]);

    return null; // This component doesn't render anything
}
