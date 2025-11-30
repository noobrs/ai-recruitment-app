import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentRecruiter } from "@/services";
import Stats from "@/components/recruiter/dashboard/Stats";
import QuickActions from "@/components/recruiter/dashboard/QuickActions";
import RecentApplications from "@/components/recruiter/dashboard/RecentApplications";
import StatsLoading from "@/components/recruiter/dashboard/StatsLoading";
import RecentAppsLoading from "@/components/recruiter/dashboard/RecentAppsLoading";

export default async function RecruiterDashboard() {
  const user = await getCurrentRecruiter();

  if (!user) redirect("/auth/recruiter/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Welcome back, {user.first_name}!</h1>
          <p className="text-gray-600">Recruiter Dashboard</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Stats first */}
        <Suspense fallback={<StatsLoading />}>
          <Stats />
        </Suspense>

        {/* Quick actions — no fetch, load instantly */}
        <QuickActions />

        {/* Recent apps — slow, separate loader */}
        <Suspense fallback={<RecentAppsLoading />}>
          <RecentApplications />
        </Suspense>

      </main>
    </div>
  );
}
