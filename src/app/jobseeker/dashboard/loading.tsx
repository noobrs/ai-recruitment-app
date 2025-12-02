export default function JobSeekerDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <main className="max-w-7xl mx-auto space-y-8">

        {/* ---------- STATS CARDS ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* ---------- QUICK ACTIONS ---------- */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 4 dashed buttons */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300"
              ></div>
            ))}
          </div>
        </div>

        {/* ---------- RECENT APPLICATIONS ---------- */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>

          {/* List of 4 recent applications */}
          <ul className="divide-y divide-gray-200">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="py-4 flex items-center justify-between">
                {/* Left side text */}
                <div>
                  <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>

                {/* Right: date + badge */}
                <div className="text-right">
                  <div className="h-4 w-20 bg-gray-200 rounded mb-2 ml-auto"></div>
                  <div className="h-5 w-20 bg-gray-200 rounded-full ml-auto"></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
