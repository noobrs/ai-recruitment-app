import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function RecruiterOnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect to login if not authenticated
    if (!user) {
        redirect('/auth/recruiter/login');
    }

    // Check if user is a recruiter
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userData?.role !== 'recruiter') {
        redirect('/auth/recruiter/login');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
            <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to AI Recruitment!
                </h1>
                <p className="text-gray-600 mb-6">
                    Before you can start posting jobs, we need to set up your company profile.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> This onboarding page is a placeholder.
                        You&apos;ll need to implement a form here to collect company information
                        or allow the recruiter to select an existing company.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">Next Steps:</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Create a form to collect company details (name, industry, website)</li>
                        <li>Or provide a dropdown to select from existing companies</li>
                        <li>Create the recruiter profile with the selected/created company</li>
                        <li>Redirect to recruiter dashboard</li>
                    </ul>
                </div>

                <div className="mt-8 flex gap-4">
                    <a
                        href="/auth/recruiter/login"
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Back to Login
                    </a>
                    <button
                        disabled
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg opacity-50 cursor-not-allowed"
                    >
                        Continue (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
}
