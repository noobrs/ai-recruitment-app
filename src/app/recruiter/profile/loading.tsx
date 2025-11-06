export default function ProfileLoading() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Profile Header Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-6">
                        {/* Profile Picture Skeleton */}
                        <div className="w-[120px] h-[120px] rounded-full bg-gray-200 animate-pulse"></div>

                        {/* Basic Info Skeleton */}
                        <div className="space-y-3">
                            <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>

                    {/* Edit Button Skeleton */}
                    <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Position Section Skeleton */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            {/* Company Info Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            {/* Posted Jobs Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>

                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                            <div className="space-y-2">
                                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
