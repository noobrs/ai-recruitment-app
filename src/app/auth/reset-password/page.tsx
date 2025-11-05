import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/utils/supabase/server";
import { type EmailOtpType } from '@supabase/supabase-js';

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token_hash?: string; type?: string; error?: string }>;
}) {
    const supabase = await createClient();
    // const params = await searchParams;
    // const token_hash = params.token_hash;
    // const type = params.type as EmailOtpType | undefined;

    // // If we have a token_hash, verify it to establish a session
    // if (token_hash && type === 'recovery') {
    //     const { error } = await supabase.auth.verifyOtp({
    //         type,
    //         token_hash,
    //     });

    //     if (error) {
    //         console.error('Password recovery verification error:', error);
    //         // Redirect to forgot password with error message
    //         redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`);
    //     }

    //     // Token verified successfully - user is now authenticated
    //     // Redirect to clean URL without token in query params
    //     redirect('/auth/reset-password');
    // }

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


// import { redirect } from "next/navigation";
// import AuthLayout from "@/components/auth/AuthLayout";
// import LoginCard from "@/components/auth/LoginCard";
// import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
// import { createClient } from "@/utils/supabase/server";
// import { type EmailOtpType } from '@supabase/supabase-js';

// export default async function ResetPasswordPage({
//     searchParams,
// }: {
//     searchParams: Promise<{ token_hash?: string; type?: string; error?: string }>;
// }) {
//     const supabase = await createClient();
//     const params = await searchParams;
//     const token_hash = params.token_hash;
//     const type = params.type as EmailOtpType | undefined;

//     // If we have a token_hash, verify it to establish a session
//     if (token_hash && type === 'recovery') {
//         const { error } = await supabase.auth.verifyOtp({
//             type,
//             token_hash,
//         });

//         if (error) {
//             console.error('Password recovery verification error:', error);
//             // Redirect to forgot password with error message
//             redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`);
//         }

//         // Token verified successfully - user is now authenticated
//         // Redirect to clean URL without token in query params
//         redirect('/auth/reset-password');
//     }

//     // Check if user is authenticated (after token verification or returning to page)
//     const { data: { user } } = await supabase.auth.getUser();

//     // Security check: User must be authenticated to access this page
//     if (!user) {
//         redirect('/auth/forgot-password');
//     }

//     return (
//         <AuthLayout>
//             <LoginCard title="Set New Password">
//                 <p className="text-center text-sm text-neutral-600 mb-6">
//                     Enter your new password below.
//                 </p>
//                 <ResetPasswordForm />
//             </LoginCard>
//         </AuthLayout>
//     );
// }
