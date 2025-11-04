import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserById } from '@/services/user.service';

export default async function AuthCallback({
    searchParams,
}: {
    searchParams: Promise<{
        token_hash?: string;
        type?: string;
        email?: string;
        next?: string;
        role?: string;
        code?: string;
    }>
}) {
    const params = await searchParams;
    const { token_hash, type, email, next, role, code } = params;
    const supabase = await createClient();

    try {
        // Handle OAuth callback (code exchange)
        if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                console.error('Code exchange error:', exchangeError);
                redirect(`/auth/${role || 'jobseeker'}/login?error=oauth_failed`);
            }

            // Get the authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Get user role from database
                const dbUser = await getUserById(user.id);
                const userRole = dbUser?.role || role || 'jobseeker';

                // Check if user profile is complete
                if (dbUser?.status === 'pending' || !dbUser?.first_name) {
                    redirect(`/${userRole}/dashboard`); // Redirect to onboarding
                }

                // User is verified and has completed profile
                redirect(next || `/${userRole}/dashboard`);
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

                redirect(`/auth/verify/${role || 'jobseeker'}/error?${errorParams.toString()}`);
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
                redirect(next || `/${userRole}/dashboard`);
            }
        }

        // Handle password reset or other callback types
        if (type === 'recovery' && token_hash) {
            redirect('/auth/reset-password');
        }

        // If no valid params, redirect to home
        redirect('/');

    } catch (error) {
        console.error('Callback error:', error);
        redirect('/auth/jobseeker/login?error=callback_failed');
    }
}
