import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import LoginForm from "@/components/auth/LoginForm";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { isValidRole, roleLabel } from "@/utils/utils";
import type { UserRole } from "@/types";

export default async function Page({ params, }: { params: Promise<{ role: string }>; }) {
    const { role: rawRole } = await params;
    const role: UserRole = isValidRole(rawRole) ? rawRole : "jobseeker";
    const title = `Log in as ${roleLabel(role)}`;

    return (
        <AuthLayout role={role}>
            <LoginCard title={title}>
                <div className="space-y-5">
                    <OAuthButtons role={role} />
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
                    <LoginForm role={role} />
                </div>
            </LoginCard>
        </AuthLayout>
    );
}
