import { getRecruiterDashboard } from "@/services/recruiter-dashboard.service";

export default async function RecentApplications() {
  const stats = await getRecruiterDashboard();
  const recent = stats?.recentApplications ?? [];

  return (
    <div className="mt-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Recent Applications
      </h2>

      {recent.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No applications yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start posting jobs to receive applications.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {recent.map((app) => (
            <li key={app.id} className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{app.jobTitle}</p>
                <p className="text-sm text-gray-600">{app.alias}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-700">{app.date}</p>

                <span
                  className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-full
                    ${app.status === "shortlisted"
                      ? "bg-green-100 text-green-700"
                      : app.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {app.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
