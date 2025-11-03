'use client';

import { signIn, signInWithGoogle } from '@/app/actions/auth.actions';
import AuthForm from '@/components/auth-old/AuthForm';

export default function LoginPageClient() {
    const handleSubmit = async (formData: FormData) => {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        return await signIn(email, password, 'jobseeker');
    };

    const handleGoogleSignIn = async () => {
        return await signInWithGoogle('jobseeker');
    };

    return (
        <AuthForm
            role="jobseeker"
            mode="login"
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
        />
    );
}
