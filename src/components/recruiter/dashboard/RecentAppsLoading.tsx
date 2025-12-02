export default function RecentAppsLoading() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>

      <ul className="divide-y divide-gray-200">
        {[...Array(4)].map((_, i) => (
          <li key={i} className="py-4 flex items-center justify-between">
            <div>
              <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>

            <div className="text-right">
              <div className="h-4 w-20 bg-gray-200 rounded mb-2 ml-auto"></div>
              <div className="h-5 w-20 bg-gray-200 rounded-full ml-auto"></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
