export default function ApplyJobLoading() {
    return (
        <div className="flex flex-col items-center justify-center bg-gray-50 py-10">
            <div className="bg-white shadow-md rounded-2xl p-10 w-full max-w-2xl animate-pulse">

                {/* Header Skeleton */}
                <div className="animate-pulse w-full">
                    {/* Back Button Placeholder */}
                    <div className="w-16 h-5 bg-gray-200 rounded mb-6" />

                    {/* Company Info Row */}
                    <div className="flex flex-row items-center mb-4">
                        {/* Logo */}
                        <div className="w-8 h-8 bg-gray-200 rounded mr-2" />
                        {/* Company Name */}
                        <div className="w-32 h-5 bg-gray-200 rounded" />
                    </div>

                    {/* Job Title */}
                    <div className="w-3/4 h-10 bg-gray-200 rounded mb-2" />

                    {/* Location/Type */}
                    <div className="w-1/3 h-4 bg-gray-200 rounded mb-6" />

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-200 mb-8" />
                </div>

                {/* Step Title */}
                <div className="w-48 h-8 bg-gray-200 rounded mb-4" />

                {/* Subtext description */}
                <div className="w-64 h-4 bg-gray-200 rounded mb-6" />

                {/* Mode Toggle Buttons (Select / Upload) */}
                <div className="flex gap-2 mb-6">
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
                </div>

                {/* Resume List Items (Mimicking 3 items) */}
                <div className="space-y-3 mb-6">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="p-4 border border-gray-100 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    {/* Resume Name */}
                                    <div className="w-32 h-5 bg-gray-200 rounded" />
                                    {/* Date */}
                                    <div className="w-24 h-4 bg-gray-200 rounded" />
                                </div>
                                {/* Radio Circle */}
                                <div className="w-5 h-5 rounded-full bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Continue Button */}
                <div className="w-full h-12 bg-gray-300 rounded-md" />
            </div>
        </div>
    );
}