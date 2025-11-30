export default function JobsLoading() {
  return (
    <div className="max-w-8/10 mx-auto animate-pulse">

      {/* ====================== SEARCH BAR ======================= */}
      <div className="h-16 bg-gray-200 max-w-3xl md:w-2/5 mx-auto my-8 rounded-full py-3"></div>

      <div className="flex">

        {/* ====================== LEFT COLUMN ======================= */}
        <div className="basis-1/4 space-y-5">

          {/* Job cards (5 items per page) */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
            >
              {/* Company + name */}
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 w-28 bg-gray-200 rounded"></div>
              </div>

              {/* Job title */}
              <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>

              {/* Location/type */}
              <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>

              {/* Date */}
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}

          {/* Pagination Skeleton */}
          <div className="flex flex-col items-center pt-5 pb-10 text-center">
            <div className="h-4 w-40 bg-gray-200 rounded mb-3"></div>

            <div className="inline-flex gap-2">
              <div className="h-9 w-16 bg-gray-200 rounded-md"></div>
              <div className="h-9 w-16 bg-gray-200 rounded-md"></div>
            </div>

            <div className="h-3 w-28 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>

        {/* ====================== RIGHT COLUMN ======================= */}
        <div className="basis-3/4 ms-10 border border-gray-200 rounded-lg shadow-sm bg-white p-6">

          {/* Header (logo + name + bookmark + expand) */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-7 h-7 bg-gray-200 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Job Title + Location + Date + Apply Btn */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="w-full">
              <div className="h-8 w-64 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-40 bg-gray-200 rounded"></div>
            </div>

            {/* Apply button */}
            <div className="h-10 w-36 bg-gray-200 rounded mt-4 sm:mt-0"></div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-4/5"></div>
              ))}
            </div>
          </div>

          {/* Overview */}
          <div className="mb-3">
            <div className="h-6 w-40 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
