import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services';

export default async function RecruiterOnboardingPage() {
    // Get current user
    const userData = await getCurrentUser();

    // Redirect to login if not authenticated
    if (!userData) {
        redirect('/auth/recruiter/login');
    }

    // Check if user is a recruiter
    if (userData.role !== 'recruiter') {
        redirect('/auth/recruiter/login');
    }

    return (
        <div>
            Recruiter Onboarding Page
        </div>
    );
}
