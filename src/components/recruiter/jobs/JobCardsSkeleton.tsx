export default function JobCardsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <>
            {[...Array(count)].map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                >
                    {/* Company Header Skeleton */}
                    <div className="flex flex-row items-center justify-between mb-2">
                        <div className="flex items-center flex-1">
                            {/* Company Logo Skeleton */}
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse mr-2"></div>
                            {/* Company Name Skeleton */}
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        {/* Bookmark Icon Skeleton */}
                        <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    {/* Job Title Skeleton */}
                    <div className="h-7 w-full bg-gray-200 rounded animate-pulse pt-2 pb-1 mb-2"></div>

                    {/* Job Location and Type Skeleton */}
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse pb-2 mb-2"></div>

                    {/* Created Date Skeleton */}
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
            ))}
        </>
    );
}
