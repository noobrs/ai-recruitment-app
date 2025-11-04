type Props = { hoverClass: string; iconClass: string };

export default function NotificationBell({ hoverClass, iconClass }: Props) {
    return (
        <button
            type="button"
            aria-label="Notifications"
            className={`relative p-2 rounded-full transition-colors ${hoverClass}`}
        >
            <svg className={`w-6 h-6 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* TODO: make this dynamic */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
    );
}
