'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormContainer from '@/components/auth/FormContainer';
import FormInput from '@/components/auth/FormInput';
import SocialButton from '@/components/auth/SocialButton';

interface RegisterPageClientProps {
    onEmailSignUp: (formData: FormData) => Promise<{ error?: string; success?: boolean; message?: string }>;
    onGoogleSignIn: () => Promise<{ error?: string; url?: string }>;
}

export default function RegisterPageClient({ onEmailSignUp, onGoogleSignIn }: RegisterPageClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setFieldErrors({});

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        // Validate passwords match
        if (password !== confirmPassword) {
            setFieldErrors({ confirmPassword: 'Passwords do not match' });
            setIsLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setFieldErrors({ password: 'Password must be at least 8 characters' });
            setIsLoading(false);
            return;
        }

        try {
            const result = await onEmailSignUp(formData);
            
            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setSuccessMessage(result.message || 'Account created! Please check your email to verify.');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await onGoogleSignIn();
            if (result.error) {
                setError(result.error);
                setIsLoading(false);
            } else if (result.url) {
                // Redirect to Google OAuth URL
                window.location.href = result.url;
            }
        } catch {
            setError('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <FormContainer
            title="Create Your Job Seeker Account"
            subtitle="Find your dream job today"
        >
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 mr-2 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium">{successMessage}</p>
                            <p className="text-xs mt-1">After verifying, you&apos;ll be redirected to complete your profile.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Google Sign In Button */}
            <SocialButton
                provider="google"
                onClick={handleGoogleSignIn}
                disabled={isLoading || !!successMessage}
                isLoading={isLoading}
            />

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
                </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-5">
                <FormInput
                    label="Email address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    disabled={isLoading || !!successMessage}
                />

                <FormInput
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    disabled={isLoading || !!successMessage}
                    error={fieldErrors.password}
                    helperText="At least 8 characters"
                />

                <FormInput
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    disabled={isLoading || !!successMessage}
                    error={fieldErrors.confirmPassword}
                />

                {/* Terms and Conditions */}
                <div className="flex items-start">
                    <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        disabled={isLoading || !!successMessage}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                        I accept the{' '}
                        <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Privacy Policy
                        </a>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !!successMessage}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating account...
                        </span>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            {/* Footer Links */}
            <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                        onClick={() => router.push('/auth/jobseeker/login')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        disabled={isLoading}
                    >
                        Sign in
                    </button>
                </p>
                <p className="text-sm text-gray-600">
                    Are you a recruiter?{' '}
                    <button
                        onClick={() => router.push('/auth/recruiter/register')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        disabled={isLoading}
                    >
                        Register as recruiter
                    </button>
                </p>
            </div>
        </FormContainer>
    );
}
