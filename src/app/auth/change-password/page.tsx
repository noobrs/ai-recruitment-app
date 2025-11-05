import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ChangePasswordPage() {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login?error=authentication_required');
    }

    return (
        <AuthLayout>
            <LoginCard title="Change Password">
                <div className="mb-6">
                    <Link
                        href={user.user_metadata?.role === 'jobseeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard'}
                        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>
                <p className="text-center text-sm text-neutral-600 mb-6">
                    Enter your current password and choose a new secure password. You will be signed out after changing your password.
                </p>
                <ChangePasswordForm />
            </LoginCard>
        </AuthLayout>
    );
}
