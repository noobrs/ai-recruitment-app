'use client';

import { signIn, signInWithGoogle } from '@/app/actions/auth.actions';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPageClient() {
    const handleSubmit = async (formData: FormData) => {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        return await signIn(email, password, 'job_seeker');
    };

    const handleGoogleSignIn = async () => {
        return await signInWithGoogle('job_seeker');
    };

    return (
        <AuthForm
            role="job_seeker"
            mode="login"
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
        />
    );
}
