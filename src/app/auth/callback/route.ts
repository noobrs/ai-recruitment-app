import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getUserWithRoleStatus } from '@/services/user.service';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const role = requestUrl.searchParams.get('role') as 'jobseeker' | 'recruiter' | null;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

    // Helper to convert role to URL path
    const roleToPath = (r: 'jobseeker' | 'recruiter' | null) => {
        if (r === 'jobseeker') return 'jobseeker';
        if (r === 'recruiter') return 'recruiter';
        return 'jobseeker'; // default
    };

    if (code) {
        const supabase = await createClient();

        // Exchange the code for a session
        const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);

        if (authError || !user) {
            return NextResponse.redirect(`${origin}/auth/${roleToPath(role)}/login?error=auth_failed`);
        }

        // Check if user record exists using service layer
        const existingUser = await getUserWithRoleStatus(user.id);

        if (existingUser) {
            // User exists - check if onboarding is complete
            if (existingUser.status === 'active' && existingUser.role) {
                // Onboarding complete - verify role matches
                if (role && existingUser.role !== role) {
                    await supabase.auth.signOut();
                    return NextResponse.redirect(
                        `${origin}/auth/${roleToPath(role)}/login?error=Please use the ${role.replace('_', ' ')} login`
                    );
                }

                // Redirect to appropriate dashboard
                const dashboard = existingUser.role === 'jobseeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard';
                return NextResponse.redirect(`${origin}${dashboard}`);
            }

            // User exists but onboarding incomplete - redirect to onboarding
            // Use the role from database if available, otherwise use role from URL
            const userRole = existingUser.role || role;
            const onboardingPath = roleToPath(userRole as 'jobseeker' | 'recruiter');
            return NextResponse.redirect(`${origin}/auth/${onboardingPath}/onboarding`);
        }

        // New OAuth user - database trigger already created basic user record
        // Store intended role in user metadata and redirect to onboarding
        if (!role) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/auth/jobseeker/login?error=Role not specified`);
        }

        // Update user metadata with intended role
        await supabase.auth.updateUser({
            data: { role: role }
        });

        // Redirect to onboarding to complete profile
        const onboardingPath = roleToPath(role);
        return NextResponse.redirect(`${origin}/auth/${onboardingPath}/onboarding`);
    }

    // No code provided - redirect back to login
    return NextResponse.redirect(`${origin}/auth/${roleToPath(role)}/login`);
}
