import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserById } from '@/services/user.service';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const email = searchParams.get('email');
    const next = searchParams.get('next');
    const code = searchParams.get('code');

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    try {
        // OAuth code exchange
        if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
                console.error("Code exchange error:", exchangeError);
                return NextResponse.redirect(new URL(`/auth/login?error=oauth_failed`, origin));
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: existedUser } = await supabaseAdmin
                    .from("users")
                    .select("id, role, status")
                    .eq("id", user.id)
                    .maybeSingle();

                // If user exists and has no role or status is pending, send to onboarding
                if (existedUser && (!existedUser.role || existedUser.status === "pending")) {
                    return NextResponse.redirect(new URL('/auth/onboarding', origin));
                }

                // If user has a role, redirect to their dashboard
                if (existedUser?.role) {
                    return NextResponse.redirect(new URL(next || `/${existedUser.role}/dashboard`, origin));
                }

                // Default to onboarding for new users
                return NextResponse.redirect(new URL('/auth/onboarding', origin));
            }
        }

        // Handle email verification links (OTP)
        if (type === 'signup' && token_hash && email) {
            const { error, data } = await supabase.auth.verifyOtp({
                type: 'signup',
                token_hash,
                email,
            });

            if (error) {
                console.error('OTP verification error:', error);

                // Redirect to error page with proper context
                const errorParams = new URLSearchParams({
                    reason: error.message,
                    ...(email && { email })
                });

                return NextResponse.redirect(
                    new URL(`/auth/verify/error?${errorParams.toString()}`, origin)
                );
            }

            // Verification successful - get user data
            if (data.user) {
                // Get user role from database
                const dbUser = await getUserById(data.user.id);

                // If user has no role or is pending, redirect to onboarding
                if (!dbUser?.role || dbUser?.status === 'pending') {
                    return NextResponse.redirect(new URL(next || '/auth/onboarding', origin));
                }

                // If user has a role and is active, redirect to dashboard
                if (dbUser.role && dbUser.status === 'active') {
                    return NextResponse.redirect(new URL(next || `/${dbUser.role}/dashboard`, origin));
                }

                // Default to onboarding
                return NextResponse.redirect(new URL('/auth/onboarding', origin));
            }
        }

        // // Handle password reset or other callback types
        // if (type === 'recovery' && token_hash) {
        //     return NextResponse.redirect(new URL('/auth/reset-password', origin));
        // }

        // If no valid params, redirect to home
        return NextResponse.redirect(new URL('/', origin));

    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.redirect(
            new URL('/auth/login?error=callback_failed', origin)
        );
    }
}
