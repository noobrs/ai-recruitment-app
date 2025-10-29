import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/services/user.service';
import LoginPageClient from '@/app/auth/recruiter/login/LoginPageClient';

export default async function RecruiterLoginPage() {
    // Check if user is already logged in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // Get user role to redirect appropriately
        const userData = await getUserRole(user.id);

        if (userData?.role === 'recruiter') {
            redirect('/recruiter/dashboard');
        } else if (userData?.role === 'jobseeker') {
            redirect('/jobseeker/dashboard');
        }
    }

    return <LoginPageClient />;
}
