import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
    return (
        <AuthLayout>
            <LoginCard title="Reset Your Password">
                <p className="text-center text-sm text-neutral-600 mb-6">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                <ForgotPasswordForm />
            </LoginCard>
        </AuthLayout>
    );
}
