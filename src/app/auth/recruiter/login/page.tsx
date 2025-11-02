import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services';
import LoginPageClient from '@/app/auth/recruiter/login/LoginPageClient';

export default async function RecruiterLoginPage() {
    // Check if user is already logged in
    const user = await getCurrentUser();

    if (user) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'recruiter') {
            redirect('/recruiter/dashboard');
        } else if (user.role === 'jobseeker') {
            redirect('/jobseeker/dashboard');
        }
    }

    return <LoginPageClient />;
}
