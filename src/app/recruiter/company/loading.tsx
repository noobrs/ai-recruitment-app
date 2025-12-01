export default function CompanyLoading() {
    return (
        <div className="max-w-5xl mx-auto p-10 bg-white shadow-md rounded-xl border border-gray-200 my-10 min-h-screen">
            {/* Header Section Skeleton */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-72 bg-gray-200 rounded animate-pulse"></div>
                </div>
                {/* Action Buttons Skeleton */}
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Main Company Card Skeleton */}
            <div className="bg-gray-50 px-8 py-6 rounded-xl border border-gray-200">
                {/* Company Logo Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-28 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>

                {/* Company Name Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full max-w-md bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Industry Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full max-w-sm bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Website Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full max-w-lg bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Description Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="space-y-2">
                        <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-5 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>

                {/* Location Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full max-w-md bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Company Size Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-28 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full max-w-xs bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Founded Year Skeleton */}
                <div className="mb-6">
                    <div className="h-4 w-28 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full max-w-xs bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
