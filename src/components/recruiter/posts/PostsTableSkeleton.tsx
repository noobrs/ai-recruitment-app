export default function PostsTableSkeleton() {
    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 text-purple-600 text-left">
                    <tr>
                        <th className="px-6 py-5 font-semibold">Job Title</th>
                        <th className="px-6 py-5 font-semibold">Type</th>
                        <th className="px-6 py-5 font-semibold">Location</th>
                        <th className="px-6 py-5 font-semibold">Applicants</th>
                        <th className="px-6 py-5 font-semibold">Date Posted</th>
                        <th className="px-6 py-5 font-semibold">Status</th>
                        <th className="px-6 py-5"></th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(10)].map((_, i) => (
                        <tr
                            key={i}
                            className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-gray-100 transition`}
                        >
                            {/* Job Title */}
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </td>
                            {/* Type */}
                            <td className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            </td>
                            {/* Location */}
                            <td className="px-6 py-4">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            </td>
                            {/* Applicants */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                                </div>
                            </td>
                            {/* Date Posted */}
                            <td className="px-6 py-4">
                                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4">
                                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                            </td>
                            {/* Actions */}
                            <td className="px-6 py-4">
                                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
