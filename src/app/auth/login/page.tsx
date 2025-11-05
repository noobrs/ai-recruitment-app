import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import LoginForm from "@/components/auth/LoginForm";
import OAuthButtons from "@/components/auth/OAuthButtons";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    const params = await searchParams;
    const message = params.message;
    const title = "Welcome Back";

    return (
        <AuthLayout>
            <LoginCard title={title}>
                {message === 'password_reset_success' && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        Password successfully reset! Please log in with your new password.
                    </div>
                )}
                <div className="space-y-5">
                    <OAuthButtons />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-neutral-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white/80 px-3 text-xs text-neutral-500 rounded-full">
                                or continue with email
                            </span>
                        </div>
                    </div>
                    <LoginForm />
                </div>
            </LoginCard>
        </AuthLayout>
    );
}
