import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import LoginForm from "@/components/auth/LoginForm";
import OAuthButtons from "@/components/auth/OAuthButtons";

export default async function LoginPage() {
    const title = "Welcome Back";

    return (
        <AuthLayout>
            <LoginCard title={title}>
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
