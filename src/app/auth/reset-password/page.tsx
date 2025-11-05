import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage() {
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
