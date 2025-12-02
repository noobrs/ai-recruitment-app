export default function RecruiterJobViewLoading() {
    return (
        <div className="max-w-7xl mx-auto my-10 bg-white rounded-lg shadow-md border border-gray-300 p-8">
            {/* Header Skeleton */}
            <div className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center">
                    {/* Company Logo Skeleton */}
                    <div className="w-10 h-10 mr-3 bg-gray-200 rounded animate-pulse"></div>
                    {/* Company Name Skeleton */}
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Back Button Skeleton */}
                <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Title Section Skeleton */}
            <div className="border-b border-gray-200 pb-3 mb-4 mt-1">
                {/* Job Title Skeleton */}
                <div className="h-9 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
                {/* Location & Type Skeleton */}
                <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
                {/* Posted Date Skeleton */}
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>

            {/* Job Description Section Skeleton */}
            <section className="mb-6">
                {/* Section Title Skeleton */}
                <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                {/* Description Content Skeleton */}
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </section>

            {/* Requirements Section Skeleton */}
            <section className="mb-6">
                {/* Section Title Skeleton */}
                <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-2"></div>
                {/* Requirements List Skeleton */}
                <div className="space-y-2">
                    <div className="flex items-center">
                        <div className="h-2 w-2 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                        <div className="h-2 w-2 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                        <div className="h-2 w-2 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                        <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                        <div className="h-2 w-2 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                        <div className="h-4 w-3/5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* Benefits Section Skeleton */}
            <section className="mb-6">
                {/* Section Title Skeleton */}
                <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mb-2"></div>
                {/* Benefits Content Skeleton */}
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </section>

            {/* Company Overview Section Skeleton */}
            <section>
                {/* Section Title Skeleton */}
                <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                {/* Company Info Skeleton */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mr-2"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mr-2"></div>
                        <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </section>
        </div>
    );
}
