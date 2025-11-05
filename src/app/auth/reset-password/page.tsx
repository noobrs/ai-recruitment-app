import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/utils/supabase/server";

export default async function ResetPasswordPage() {
    const supabase = await createClient();

    // Check if user is authenticated (after token verification or returning to page)
    const { data: { user } } = await supabase.auth.getUser();

    // Security check: User must be authenticated to access this page
    if (!user) {
        redirect('/auth/forgot-password');
    }

    return (
        <AuthLayout>
            <LoginCard title="Set New Password">
                <p className="text-center text-sm text-neutral-600 mb-6">
                    Enter your new password below.
                </p>
                <ResetPasswordForm />
            </LoginCard>
        </AuthLayout>
    );
}