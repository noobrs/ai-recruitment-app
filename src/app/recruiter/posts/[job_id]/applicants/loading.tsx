export default function LoadingPostDetailsPage() {
    return (
        <div className="max-w-8/10 p-10 justify-center mx-auto my-5 min-h-screen animate-pulse">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="h-8 w-40 bg-gray-300 rounded-md mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
                </div>

                <div className="h-10 w-32 bg-gray-200 rounded-full"></div>
            </div>

            {/* Job Details Card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-10">
                <div className="flex justify-between gap-6">

                    {/* Left */}
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>

                            <div>
                                <div className="h-6 w-48 bg-gray-200 rounded-md mb-2"></div>
                                <div className="h-4 w-32 bg-gray-100 rounded-md"></div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-5 text-sm">
                            <div className="h-7 w-24 bg-gray-200 rounded-full"></div>
                            <div className="h-7 w-20 bg-gray-200 rounded-full"></div>
                            <div className="h-7 w-20 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="text-right">
                        <div className="h-4 w-24 bg-gray-200 rounded-md ml-auto mb-2"></div>
                        <div className="h-6 w-20 bg-gray-300 rounded-md ml-auto mb-4"></div>

                        <div className="h-4 w-28 bg-gray-200 rounded-md ml-auto mb-1"></div>
                        <div className="h-8 w-16 bg-gray-300 rounded-md ml-auto"></div>
                    </div>
                </div>

            </div>

            {/* Search Bar */}
            <div className="flex items-center w-full border border-gray-200 rounded-full px-4 py-3 bg-white shadow-sm mb-8">
                <div className="h-5 w-5 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-4 w-full bg-gray-100 rounded-md"></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-10">
                <div className="h-8 w-28 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-28 bg-gray-200 rounded-full"></div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="border-gray-200 bg-gray-50 p-4">
                    <div className="h-4 w-32 bg-gray-200 rounded-md"></div>
                </div>

                {/* Rows */}
                <div>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex justify-between items-center px-6 py-4 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                        >
                            {/* Applicant */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="h-4 w-40 bg-gray-200 rounded-md"></div>
                            </div>

                            {/* Score */}
                            <div className="h-4 w-12 bg-gray-200 rounded-md"></div>

                            {/* Date */}
                            <div className="h-4 w-20 bg-gray-200 rounded-md"></div>

                            {/* Status */}
                            <div className="h-4 w-24 bg-gray-200 rounded-md"></div>

                            {/* Details */}
                            <div className="h-4 w-16 bg-gray-200 rounded-md"></div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
