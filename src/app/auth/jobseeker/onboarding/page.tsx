import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/services';
import OnboardingClient from '@/app/auth/jobseeker/onboarding/OnboardingClient';

export default async function JobSeekerOnboardingPage() {
    // Get current user
    const userData = await getCurrentUser();

    // Redirect to login if not authenticated
    if (!userData) {
        redirect('/auth/jobseeker/login');
    }

    // Check if already onboarded
    if (userData.status === 'active' && userData.role === 'jobseeker') {
        redirect('/jobseeker/dashboard');
    }

    // Get auth user metadata for OAuth name extraction
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Extract name from Google OAuth metadata if available
    const fullName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || '';
    const nameParts = fullName.split(' ');
    const defaultFirstName = nameParts[0] || userData.first_name || '';
    const defaultLastName = nameParts.slice(1).join(' ') || userData.last_name || '';

    return <OnboardingClient
        email={authUser?.email || ''}
        defaultFirstName={defaultFirstName}
        defaultLastName={defaultLastName}
    />;
}
