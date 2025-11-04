import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserById } from '@/services/user.service';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const email = searchParams.get('email');
    const next = searchParams.get('next');
    const role = searchParams.get('role');
    const code = searchParams.get('code');

    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    try {
        // Handle OAuth callback (code exchange)
        if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                console.error('Code exchange error:', exchangeError);
                return NextResponse.redirect(
                    new URL(`/auth/${role || 'jobseeker'}/login?error=oauth_failed`, origin)
                );
            }

            // Get the authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Get user role from database
                const dbUser = await getUserById(user.id);
                const userRole = dbUser?.role || role || 'jobseeker';

                // Check if user profile is complete
                if (dbUser?.status === 'pending' || !dbUser?.first_name) {
                    return NextResponse.redirect(new URL(`/${userRole}/dashboard`, origin));
                }

                // User is verified and has completed profile
                return NextResponse.redirect(new URL(next || `/${userRole}/dashboard`, origin));
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
                    new URL(`/auth/verify/${role || 'jobseeker'}/error?${errorParams.toString()}`, origin)
                );
            }

            // Verification successful - get user data
            if (data.user) {
                // Get user role from database
                const dbUser = await getUserById(data.user.id);
                const userRole = dbUser?.role || role || 'jobseeker';

                // Update user status to active if still pending
                if (dbUser?.status === 'pending') {
                    await supabase
                        .from('users')
                        .update({ status: 'active', updated_at: new Date().toISOString() })
                        .eq('id', data.user.id);
                }

                // Redirect to next page or dashboard
                return NextResponse.redirect(new URL(next || `/${userRole}/dashboard`, origin));
            }
        }

        // Handle password reset or other callback types
        if (type === 'recovery' && token_hash) {
            return NextResponse.redirect(new URL('/auth/reset-password', origin));
        }

        // If no valid params, redirect to home
        return NextResponse.redirect(new URL('/', origin));

    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.redirect(
            new URL('/auth/jobseeker/login?error=callback_failed', origin)
        );
    }
}
