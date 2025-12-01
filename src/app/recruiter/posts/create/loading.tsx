export default function PostJobLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-80 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {/* Form Skeleton */}
                    <div className="space-y-6">
                        {/* Job Title */}
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Company */}
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Location */}
                        <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Job Type & Work Mode Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div>
                                <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>

                        {/* Salary Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div>
                                <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>

                        {/* Job Description */}
                        <div>
                            <div className="h-5 w-36 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Requirements */}
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Skills */}
                        <div>
                            <div className="h-5 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Experience Level */}
                        <div>
                            <div className="h-5 w-36 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Education Level */}
                        <div>
                            <div className="h-5 w-36 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Application Deadline */}
                        <div>
                            <div className="h-5 w-40 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <div className="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
                            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
