import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const role = requestUrl.searchParams.get('role') as 'job_seeker' | 'recruiter' | null;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

    if (code) {
        const supabase = await createClient();

        // Exchange the code for a session
        const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);

        if (authError || !user) {
            return NextResponse.redirect(`${origin}/auth/${role || 'jobseeker'}/login?error=auth_failed`);
        }

        // Check if user record exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', user.id)
            .single();

        if (existingUser) {
            // User exists - verify role matches
            if (role && existingUser.role !== role) {
                await supabase.auth.signOut();
                return NextResponse.redirect(
                    `${origin}/auth/${role}/login?error=Please use the ${role.replace('_', ' ')} login`
                );
            }

            // Redirect to appropriate dashboard
            const dashboard = existingUser.role === 'job_seeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard';
            return NextResponse.redirect(`${origin}${dashboard}`);
        }

        // New OAuth user - create user profile with specified role
        if (!role) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/auth/jobseeker/login?error=Role not specified`);
        }

        // Extract name from user metadata
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create user record
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email!,
                first_name: firstName,
                last_name: lastName,
                role: role,
            });

        if (userError) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/auth/${role}/login?error=Failed to create profile`);
        }

        // Create role-specific profile
        if (role === 'job_seeker') {
            const { error: jobSeekerError } = await supabase
                .from('job_seeker')
                .insert({
                    user_id: user.id,
                });

            if (jobSeekerError) {
                await supabase.auth.signOut();
                return NextResponse.redirect(`${origin}/auth/${role}/login?error=Failed to create job seeker profile`);
            }

            return NextResponse.redirect(`${origin}/jobseeker/dashboard`);
        } else if (role === 'recruiter') {
            // For OAuth recruiter sign-up, we cannot create recruiter profile without company_id
            // We need to redirect to onboarding/setup page where they can select/create company
            // For now, we'll just create the user record and redirect to a setup page
            // You'll need to create this onboarding page later

            // Option 1: Redirect to onboarding (recommended)
            return NextResponse.redirect(`${origin}/recruiter/onboarding?new_user=true`);

            // Option 2: Create with a default/placeholder company (not recommended)
            // const { error: recruiterError } = await supabase
            //     .from('recruiter')
            //     .insert({
            //         user_id: user.id,
            //         company_id: 1, // Default company ID
            //     });

            // if (recruiterError) {
            //     await supabase.auth.signOut();
            //     return NextResponse.redirect(`${origin}/auth/${role}/login?error=Failed to create recruiter profile`);
            // }

            // return NextResponse.redirect(`${origin}/recruiter/dashboard`);
        }
    }

    // No code provided - redirect back to login
    return NextResponse.redirect(`${origin}/auth/${role || 'jobseeker'}/login`);
}
