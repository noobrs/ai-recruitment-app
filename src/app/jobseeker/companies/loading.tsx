export default function CompaniesLoading() {
  return (
    <div className="max-w-8/10 mx-auto my-8 px-4 animate-pulse">

      {/* ====================== SEARCH BAR ======================= */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="h-12 bg-gray-200 w-full md:w-2/5 rounded-lg"></div>
        <div className="h-12 bg-gray-200 w-full md:w-2/5 rounded-lg"></div>
        <div className="h-12 bg-gray-200 w-full md:w-1/5 rounded-lg"></div>
      </div>

      <div className="flex">

        {/* ====================== LEFT COLUMN ======================= */}
        <div className="basis-1/4 space-y-5">

          {/* Company cards (5 items) */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
            >
              {/* Logo + Name */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
              </div>

              {/* Industry */}
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>

              {/* Location */}
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>

              {/* Employee size */}
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}

          {/* Pagination */}
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
        <div className="basis-3/4 ms-10 border border-gray-200 rounded-lg shadow-sm bg-white p-10">

          {/* Header: Logo + Buttons */}
          <div className="flex flex-row items-start justify-between pb-6 border-b border-gray-100">

            <div className="flex items-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full border border-gray-200"></div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>

          {/* Company Name + Info */}
          <div className="flex flex-row items-start justify-between mt-6">
            <div className="space-y-4">
              <div className="h-7 w-64 bg-gray-200 rounded"></div>
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
              <div className="h-5 w-56 bg-gray-200 rounded"></div>
            </div>

            <div className="h-10 w-36 bg-gray-200 rounded"></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mt-8 border-b border-gray-200 pb-3">
            <div className="h-5 w-16 bg-gray-300 rounded"></div>
            <div className="h-5 w-16 bg-gray-200 rounded"></div>
            <div className="h-5 w-16 bg-gray-200 rounded"></div>
            <div className="h-5 w-16 bg-gray-200 rounded"></div>
          </div>

          {/* About Section */}
          <section className="mt-8">
            <div className="h-6 w-40 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </section>

          {/* Jobs Section */}
          <section className="mt-10">
            <div className="h-6 w-40 bg-gray-200 rounded mb-5"></div>

            {/* Two-column job grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded mr-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>

                  <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>

            {/* Show More */}
            <div className="flex justify-center mt-6">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
