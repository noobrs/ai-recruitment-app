import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const params = await searchParams;
    const error = params.error;

    return (
        <AuthLayout>
            <LoginCard title="Reset Your Password">
                <p className="text-center text-sm text-neutral-600 mb-6">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                <ForgotPasswordForm />
            </LoginCard>
        </AuthLayout>
    );
}
