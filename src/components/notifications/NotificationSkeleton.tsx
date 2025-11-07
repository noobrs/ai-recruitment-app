export default function NotificationSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page title skeleton */}
                <div className="h-9 w-48 bg-gray-200 rounded-md mb-6 animate-pulse" />

                <div className="flex gap-4 h-[calc(100vh-12rem)]">
                    {/* Left column - Notification list skeleton */}
                    <div className="w-1/3 min-w-[320px]">
                        <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                            {/* Header skeleton */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                                </div>
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>

                            {/* Notification items skeleton */}
                            <div className="flex-1 overflow-hidden">
                                {[...Array(6)].map((_, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border-b border-gray-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Unread indicator */}
                                            <div className="mt-2 w-2 h-2 bg-gray-200 rounded-full shrink-0 animate-pulse" />

                                            <div className="flex-1 min-w-0 space-y-2">
                                                {/* Type badge */}
                                                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />

                                                {/* Message preview - 2 lines */}
                                                <div className="space-y-1.5">
                                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                                </div>

                                                {/* Timestamp */}
                                                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column - Notification detail skeleton */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden">
                            <div className="p-6">
                                {/* Header section */}
                                <div className="mb-6 space-y-3">
                                    {/* Type badge */}
                                    <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />

                                    {/* Status indicator */}
                                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />

                                    {/* Timestamps */}
                                    <div className="space-y-2">
                                        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200 mb-6" />

                                {/* Message content skeleton */}
                                <div className="space-y-3">
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                </div>

                                {/* Related application card skeleton */}
                                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
