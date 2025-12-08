export default function ApplicantsTableSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm">
            <table className="min-w-full text-sm text-gray-700">
                <tbody>
                    {[...Array(10)].map((_, i) => (
                        <tr
                            key={i}
                            className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-gray-100 transition`}
                        >
                            {/* Applicant - Score and Name */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    {/* Score Circle Skeleton */}
                                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                                    {/* Name Skeleton */}
                                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </td>
                            {/* Job Title */}
                            <td className="px-6 py-4">
                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                            </td>
                            {/* Application Date */}
                            <td className="px-6 py-4">
                                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4">
                                <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse" />
                            </td>
                            {/* View Details */}
                            <td className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
