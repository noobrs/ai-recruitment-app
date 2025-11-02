import { redirect } from 'next/navigation';
import { getCurrentJobSeeker } from '@/services';
import UploadResumeAction from '@/components/resume/UploadResumeAction';

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Applications</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                        <p className="text-sm text-gray-600 mt-1">Total submitted</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Interviews</h3>
                        <p className="text-3xl font-bold text-indigo-600 mt-2">0</p>
                        <p className="text-sm text-gray-600 mt-1">Scheduled</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Profile Views</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">0</p>
                        <p className="text-sm text-gray-600 mt-1">This month</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                            <span className="text-sm font-medium">Browse Jobs</span>
                        </button>
                        <UploadResumeAction />
                        <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                            <span className="text-sm font-medium">View Applications</span>
                        </button>
                        <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                            <span className="text-sm font-medium">Edit Profile</span>
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                        <p className="mt-1 text-sm text-gray-500">Start applying to jobs to see your activity here.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
