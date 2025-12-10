export default function ApplicationDetailLoading() {
    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button Skeleton */}
                <div className="mb-6">
                    <div className="flex items-center mb-4">
                        <div className="w-5 h-5 bg-gray-200 rounded mr-2 animate-pulse" />
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                {/* Row 1: Status Pipeline Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="flex flex-col items-center space-y-2">
                                {/* Circle */}
                                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                                {/* Label */}
                                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 2: Application Info Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                    {/* Job + Company summary */}
                    <div className="flex items-start gap-4">
                        {/* Logo skeleton */}
                        <div className="w-14 h-14 bg-gray-200 rounded-lg animate-pulse" />

                        <div className="flex-1 space-y-3">
                            {/* Job title */}
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
                            </div>

                            {/* Company name */}
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* View job button skeleton */}
                        <div className="h-10 w-28 bg-gray-200 rounded-full animate-pulse" />
                    </div>

                    {/* Divider */}
                    <div className="border-t pt-4 flex text-gray-300 flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Applied date skeleton */}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* View resume button skeleton */}
                        <div className="h-10 w-44 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
