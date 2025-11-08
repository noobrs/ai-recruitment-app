'use client';

import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function ChangePasswordPage() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                redirect('/auth/login?error=authentication_required');
            } else {
                setUser(user);
            }
        }
        fetchUser();
    }, []);

    if (!user) return null;

    return (
        <AuthLayout>
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
            </div>
            <LoginCard title="Change Password">
                <p className="text-center text-sm text-neutral-600 mb-6">
                    Enter your current password and choose a new secure password. You will be signed out after changing your password.
                </p>
                <ChangePasswordForm />
            </LoginCard>
        </AuthLayout>
    );
}


// import { redirect } from "next/navigation";
// import AuthLayout from "@/components/auth/AuthLayout";
// import LoginCard from "@/components/auth/LoginCard";
// import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
// import { createClient } from "@/utils/supabase/server";
// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";

// export default async function ChangePasswordPage() {
//     const supabase = await createClient();

//     // Check if user is authenticated
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//         redirect('/auth/login?error=authentication_required');
//     }

//     return (
//         <AuthLayout>
//             <div className="mb-6">
//                 <Link
//                     href={user.user_metadata?.role === 'jobseeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard'}
//                     className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
//                 >
//                     <ArrowLeft className="h-4 w-4" />
//                     Back to Dashboard
//                 </Link>
//             </div>
//             <LoginCard title="Change Password">
//                 <p className="text-center text-sm text-neutral-600 mb-6">
//                     Enter your current password and choose a new secure password. You will be signed out after changing your password.
//                 </p>
//                 <ChangePasswordForm />
//             </LoginCard>
//         </AuthLayout>
//     );
// }
