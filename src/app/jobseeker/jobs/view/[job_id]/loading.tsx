export default function JobViewLoading() {
    return (
        <div className="max-w-8/10 mx-auto my-10 bg-white rounded-lg shadow-md border border-gray-300 p-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center">
                    {/* Company Logo Skeleton */}
                    <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
                    {/* Company Name Skeleton */}
                    <div className="h-6 w-40 bg-gray-200 rounded"></div>
                </div>

                {/* Bookmark Icon Skeleton */}
                <div className="w-7 h-7 bg-gray-200 rounded"></div>
            </div>

            {/* Job Title & Meta Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-3 mb-4 mt-1">
                <div className="flex-1">
                    {/* Job Title Skeleton */}
                    <div className="h-9 w-3/4 bg-gray-200 rounded mb-4"></div>
                    {/* Location & Type Skeleton */}
                    <div className="h-5 w-1/2 bg-gray-200 rounded mb-2"></div>
                    {/* Posted Date Skeleton */}
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                {/* Apply Button Skeleton */}
                <div className="mt-4 sm:mt-0 w-36 h-10 bg-gray-200 rounded"></div>
            </div>

            {/* Job Description Section Skeleton */}
            <section className="mb-6">
                <div className="h-7 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                    <div className="h-4 w-4/5 bg-gray-200 rounded"></div>
                </div>
            </section>

            {/* Requirements Section Skeleton */}
            <section className="mb-6">
                <div className="h-7 w-40 bg-gray-200 rounded mb-2"></div>
                <div className="space-y-2">
                    <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                    <div className="h-4 w-10/12 bg-gray-200 rounded"></div>
                    <div className="h-4 w-9/12 bg-gray-200 rounded"></div>
                </div>
            </section>

            {/* Benefits Section Skeleton */}
            <section className="mb-6">
                <div className="h-7 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                    <div className="h-4 w-4/5 bg-gray-200 rounded"></div>
                </div>
            </section>

            {/* Company Overview Section Skeleton */}
            <section>
                <div className="h-7 w-52 bg-gray-200 rounded mb-2"></div>
                <div className="space-y-2">
                    <div className="h-4 w-64 bg-gray-200 rounded"></div>
                    <div className="h-4 w-72 bg-gray-200 rounded"></div>
                </div>
            </section>
        </div>
    );
}
