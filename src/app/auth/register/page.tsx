import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import RegisterForm from "@/components/auth/RegisterForm";
import OAuthButtons from "@/components/auth/OAuthButtons";

export default async function RegisterPage() {
    const title = "Create Your Account";

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
                                or sign up with email
                            </span>
                        </div>
                    </div>
                    <RegisterForm />
                </div>
            </LoginCard>
        </AuthLayout>
    );
}
