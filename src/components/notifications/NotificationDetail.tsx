'use client';

import { Notification } from '@/types';
import { formatDistanceToNow } from '@/utils/utils';

type Props = {
  notification: Notification | null;
};

export default function NotificationDetail({ notification }: Props) {
  if (!notification) {
    return (
      <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-sm">Select a notification to view details</p>
        </div>
      </div>
    );
  }

  const typeColors = {
    resume: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    application: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    general: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
  };

  const colors = typeColors[notification.type || 'general'];

  return (
    <div className="bg-white rounded-lg shadow-sm h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          {/* Type badge */}
          {notification.type && (
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-3 ${colors.bg} ${colors.text}`}>
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </span>
          )}

          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-2">
            {notification.opened_at ? (
              <span className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Read
              </span>
            ) : (
              <span className="flex items-center text-sm text-blue-600 font-medium">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                Unread
              </span>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Received {formatDistanceToNow(notification.created_at)}</p>
            {notification.opened_at && (
              <p>Read {formatDistanceToNow(notification.opened_at)}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t ${colors.border} mb-6`} />

        {/* Message content */}
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
}
