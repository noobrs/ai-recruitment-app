'use client';

import { Notification } from '@/types';
import { formatDistanceToNow } from '@/utils/utils';

type Props = {
    notifications: Notification[];
    selectedId?: number;
    onNotificationClick: (notification: Notification) => void;
    onMarkAllAsRead: () => void;
    isLoading: boolean;
};

export default function NotificationList({
    notifications,
    selectedId,
    onNotificationClick,
    onMarkAllAsRead,
    isLoading,
}: Props) {
    const unreadCount = notifications.filter((n) => !n.opened_at).length;

    return (
        <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                        All Notifications
                    </h2>
                    {unreadCount > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        disabled={isLoading}
                        className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg
                            className="w-16 h-16 mb-4"
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
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <NotificationItem
                            key={notification.notification_id}
                            notification={notification}
                            isSelected={selectedId === notification.notification_id}
                            onClick={() => onNotificationClick(notification)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

type NotificationItemProps = {
    notification: Notification;
    isSelected: boolean;
    onClick: () => void;
};

function NotificationItem({ notification, isSelected, onClick }: NotificationItemProps) {
    const isUnread = !notification.opened_at;

    const typeColors = {
        resume: 'bg-blue-100 text-blue-800',
        application: 'bg-green-100 text-green-800',
        general: 'bg-gray-100 text-gray-800',
    };

    const typeColor = typeColors[notification.type || 'general'];

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                } ${isUnread ? 'bg-blue-50/50' : ''}`}
        >
            <div className="flex items-start gap-3">
        {/* Unread indicator */}
        {isUnread && (
          <div className="mt-2 w-2 h-2 bg-blue-600 rounded-full shrink-0" />
        )}                <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    {notification.type && (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${typeColor}`}>
                            {notification.type}
                        </span>
                    )}

                    {/* Message preview */}
                    <p className={`text-sm line-clamp-2 ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.message}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(notification.created_at)}
                    </p>
                </div>
            </div>
        </button>
    );
}
