import { getRecruiterDashboard } from "@/services/recruiter-dashboard.service";

export default async function Stats() {
  const stats = await getRecruiterDashboard();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Active Jobs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {stats?.activeJobs}
        </p>
        <p className="text-sm text-gray-600 mt-1">Currently posted</p>
      </div>

      {/* Applications */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Applications</h3>
        <p className="text-3xl font-bold text-indigo-600 mt-2">
          {stats?.applicationsThisWeek}
        </p>
        <p className="text-sm text-gray-600 mt-1">New this week</p>
      </div>

      {/* Interviews */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Interviews</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">
          {stats?.scheduledInterviews}
        </p>
        <p className="text-sm text-gray-600 mt-1">Scheduled</p>
      </div>

      {/* Hired */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Hired</h3>
        <p className="text-3xl font-bold text-blue-600 mt-2">
          {stats?.hiresThisMonth}
        </p>
        <p className="text-sm text-gray-600 mt-1">This month</p>
      </div>
    </div>
  );
}
