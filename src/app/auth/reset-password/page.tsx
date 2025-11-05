import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/utils/supabase/server";

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; type?: string }>;
}) {
    const supabase = await createClient();
    const params = await searchParams;

    // Check if user is authenticated (after token verification or returning to page)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/forgot-password?error=invalid_session');
    }

    const error = params.error;

    return (
        <AuthLayout>
            <LoginCard title="Set New Password">
                <p className="text-center text-sm text-neutral-600 mb-6">
                    Enter your new password below. You will be signed out after resetting.
                </p>
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error === 'rate_limit' && 'Too many attempts. Please try again later.'}
                        {error === 'invalid_token' && 'Invalid or expired reset link. Please request a new one.'}
                        {error !== 'rate_limit' && error !== 'invalid_token' && error}
                    </div>
                )}
                <ResetPasswordForm />
            </LoginCard>
        </AuthLayout>
    );
}