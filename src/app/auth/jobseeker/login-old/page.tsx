import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services';
import LoginPageClient from '@/app/auth/jobseeker/login-old/LoginPageClient';

export default async function JobSeekerLoginPage() {
    // Check if user is already logged in
    const user = await getCurrentUser();

    if (user) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'jobseeker') {
            redirect('/jobseeker/dashboard');
        } else if (user.role === 'recruiter') {
            redirect('/recruiter/dashboard');
        }
    }

    return <LoginPageClient />;
}
