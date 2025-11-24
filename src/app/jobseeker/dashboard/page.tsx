import { redirect } from 'next/navigation';
import { getCurrentJobSeeker } from '@/services';
import DashboardClient from './client';

export default async function JobSeekerDashboard() {
    // Get current job seeker (includes authentication and role check)
    const userData = await getCurrentJobSeeker();

    if (!userData) {
        redirect('/auth/jobseeker/login');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, {userData.first_name}!
                    </h1>
                    <p className="text-gray-600 mt-1">Job Seeker Dashboard</p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DashboardClient user={userData} />
            </main>
        </div>
    );
}
