export default function EditJobLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-72 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white p-8 border border-gray-200 rounded-lg shadow">
                    {/* Title */}
                    <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-6"></div>

                    <div className="space-y-6">
                        {/* Job Title */}
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Job Description */}
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Location */}
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Job Type & Work Mode Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div>
                                <div className="h-5 w-28 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>

                        {/* Industry */}
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Salary Range */}
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Job Status */}
                        <div>
                            <div className="h-5 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Submit Button */}
                        <div className="h-12 w-full bg-gray-300 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </main>
        </div>
    );
}
