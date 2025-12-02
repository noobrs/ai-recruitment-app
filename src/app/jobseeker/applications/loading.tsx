export default function ApplicationsLoading() {
    return (
        <div className="max-w-8/10 p-10 justify-center mx-auto my-5 min-h-screen">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
                <div className="h-9 w-64 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
            </div>

            {/* Search & Filter Skeleton */}
            <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center w-full border rounded-full px-4 py-3 bg-white shadow-sm">
                    <div className="w-5 h-5 bg-gray-200 rounded mr-2 animate-pulse" />
                    <div className="w-full h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="w-5 h-5 bg-gray-200 rounded ml-2 animate-pulse" />
                </div>
            </div>

            {/* Status Filters Skeleton */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {[...Array(4)].map((_, index) => (
                    <div
                        key={index}
                        className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"
                    />
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-6 py-3 text-left">
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-6 py-3 text-left">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-6 py-3 text-left">
                                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(10)].map((_, index) => (
                            <tr
                                key={index}
                                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
