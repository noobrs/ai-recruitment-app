import { signUpWithEmail, signInWithGoogle } from '@/app/actions/auth.actions';
import RegisterPageClient from './RegisterPageClient';

export default function RegisterPage() {
    const handleEmailSignUp = async (formData: FormData) => {
        'use server';
        
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        return await signUpWithEmail(email, password, 'jobseeker');
    };

    const handleGoogleSignIn = async () => {
        'use server';
        return await signInWithGoogle('jobseeker');
    };

    return (
        <RegisterPageClient
            onEmailSignUp={handleEmailSignUp}
            onGoogleSignIn={handleGoogleSignIn}
        />
    );
}
