import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/services/user.service';
import OnboardingClient from '@/app/auth/jobseeker/onboarding/OnboardingClient';

export default async function JobSeekerOnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect to login if not authenticated
    if (!user) {
        redirect('/auth/jobseeker/login');
    }

    // Check if already onboarded
    const userData = await getUserProfile(user.id);

    if (userData?.status === 'active' && userData?.role === 'jobseeker') {
        redirect('/jobseeker/dashboard');
    }

    // Extract name from Google OAuth metadata if available
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const nameParts = fullName.split(' ');
    const defaultFirstName = nameParts[0] || userData?.first_name || '';
    const defaultLastName = nameParts.slice(1).join(' ') || userData?.last_name || '';

    return <OnboardingClient
        email={user.email || ''}
        defaultFirstName={defaultFirstName}
        defaultLastName={defaultLastName}
    />;
}
