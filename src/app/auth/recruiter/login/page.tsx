import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import LoginPageClient from '@/app/auth/recruiter/login/LoginPageClient';

export default async function RecruiterLoginPage() {
    // Check if user is already logged in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // Get user role to redirect appropriately
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role === 'recruiter') {
            redirect('/recruiter/dashboard');
        } else if (userData?.role === 'jobseeker') {
            redirect('/jobseeker/dashboard');
        }
    }

    return <LoginPageClient />;
}
