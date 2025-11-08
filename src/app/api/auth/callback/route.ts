import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

/*
 * Google SSO Callback Route
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    try {
        // OAuth code exchange
        if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                console.log("Code exchange error:", exchangeError);
                return NextResponse.redirect(new URL(`/auth/login?error=oauth_failed`, origin));
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: existedUser } = await supabaseAdmin
                    .from("users")
                    .select("id, status, role")
                    .eq("id", user.id)
                    .maybeSingle();

                // If user exists and status is pending, send to onboarding
                if (existedUser && existedUser.status === "pending") {
                    return NextResponse.redirect(new URL('/auth/onboarding', origin));
                }

                // If user is active, redirect to their dashboard based on role
                if (existedUser && existedUser.status === "active") {
                    if (existedUser.role === 'jobseeker') {
                        return NextResponse.redirect(new URL('/jobseeker/dashboard', origin));
                    } else if (existedUser.role === 'recruiter') {
                        return NextResponse.redirect(new URL('/recruiter/dashboard', origin));
                    }
                }
            }
        }

        // If no valid params, redirect to home
        return NextResponse.redirect(new URL('/', origin));

    } catch (error) {
        console.log('Callback error:', error);
        return NextResponse.redirect(
            new URL('/auth/login?error=callback_failed', origin)
        );
    }
}
