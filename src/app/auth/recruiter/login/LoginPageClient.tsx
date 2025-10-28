'use client';

import { signIn, signInWithGoogle } from '@/app/actions/auth.actions';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPageClient() {
    const handleSubmit = async (formData: FormData) => {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        return await signIn(email, password, 'recruiter');
    };

    const handleGoogleSignIn = async () => {
        return await signInWithGoogle('recruiter');
    };

    return (
        <AuthForm
            role="recruiter"
            mode="login"
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
        />
    );
}
