export default function JobsLoading() {
  return (
    <div className="flex max-w-7xl mx-auto my-8 px-4 animate-pulse">
      {/* LEFT: Job List */}
      <div className="basis-1/4 space-y-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
            </div>
            <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}

        {/* Pagination skeleton */}
        <div className="flex flex-col items-center pt-5 pb-10">
          <div className="h-4 w-40 bg-gray-200 rounded mb-3"></div>
          <div className="inline-flex gap-2">
            <div className="h-9 w-16 bg-gray-200 rounded-md"></div>
            <div className="h-9 w-16 bg-gray-200 rounded-md"></div>
          </div>
          <div className="h-3 w-28 bg-gray-200 rounded mt-2"></div>
        </div>
      </div>

      {/* RIGHT: Job Details */}
      <div className="basis-3/4 ms-10 border border-gray-200 rounded-lg shadow-sm bg-white p-6">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 bg-gray-200 rounded"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-40 bg-gray-200 rounded"></div>
        </div>

        <div className="h-10 w-36 bg-gray-200 rounded mb-8"></div>

        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-4 w-full bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
