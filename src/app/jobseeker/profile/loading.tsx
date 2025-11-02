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

                {/* About Me Section Skeleton */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Profile Resume Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>

                <div className="space-y-4">
                    {/* Skills Skeleton */}
                    <div>
                        <div className="h-5 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-7 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    {/* Experience Skeleton */}
                    <div>
                        <div className="h-5 w-28 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="border-l-2 border-gray-200 pl-4 space-y-2">
                                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* All Resumes Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>

                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
