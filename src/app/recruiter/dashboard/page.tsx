import { redirect } from "next/navigation";
import { getCurrentRecruiter } from "@/services";
import DashboardClient from "./client";

export default async function RecruiterDashboard() {
  const user = await getCurrentRecruiter();

  if (!user) redirect("/auth/recruiter/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Welcome back, {user.first_name}!</h1>
          <p className="text-gray-600">Recruiter Dashboard</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DashboardClient user={user} />
      </main>
    </div>
  );
}
