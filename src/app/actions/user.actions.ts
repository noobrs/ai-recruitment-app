"use server";

import { createClient, protectRoute } from "@/utils/supabase/server";
import { getErrorMessage } from "@/utils/utils";
import { redirect } from 'next/navigation';

/*
* Google SSO Action
*/
export const googleSignInAction = async () => {
    const supabase = await createClient();
    const base = process.env.NEXT_PUBLIC_SITE_URL;

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${base}/api/auth/callback`,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });

    if (error) return { error: error.message };
    if (data.url) return { url: data.url };
    return { error: "Failed to initiate Google sign in" };
};

/*
* Register Action
*/
export async function registerAction(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    // Validation: Check if passwords match
    if (password !== confirmPassword) {
        return { errorMessage: "Passwords do not match" };
    }

    // Validation: Check password strength (minimum 8 characters)
    if (password.length < 8) {
        return { errorMessage: "Password must be at least 8 characters long" };
    }

    // Validation: Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { errorMessage: "Please enter a valid email address" };
    }

    const supabase = await createClient();

    try {
        // Register new user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/onboarding`,
            }
            // options: {
            //     emailRedirectTo: `${origin}/api/auth/callback?next=/auth/onboarding`,
            //     data: {
            //         // User will select role during onboarding
            //     },
            // },
        });

        if (authError) {
            console.log('Auth registration error:', authError);
            // Handle specific error cases
            if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
                // User exists - check if they verified their email
                // Try to resend verification in case they didn't verify
                const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email,
                    options: {
                        emailRedirectTo: `${origin}/api/auth/callback?next=/auth/onboarding`,
                    },
                });

                if (!resendError) {
                    // Successfully resent - they probably didn't verify
                    redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
                }

                // If resend failed, user is likely already verified
                return { errorMessage: "This email is already registered. Please login instead." };
            }
            return { errorMessage: authError.message };
        }

        if (!authData.user) {
            return { errorMessage: "Registration failed. Please try again." };
        }

    } catch (error) {
        console.error('Registration error:', error);
        return { errorMessage: "An unexpected error occurred. Please try again." };
    }

    // Redirect to verification page via page route (displays UI)
    redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
}

/*
* Log In Action
*/
export async function loginAction(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { errorMessage: error.message };
    }

    return { errorMessage: null };
}

/*
* Forgot Password Action
*/
export async function forgotPasswordAction(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    // Validation: Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { errorMessage: "Please enter a valid email address" };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // redirectTo: `${origin}/auth/reset-password`,
    });

    if (error) {
        return { errorMessage: error.message };
    }

    return { errorMessage: null };
}

/*
* Reset Password Action
*/
export async function resetPasswordAction(formData: FormData) {
    const password = String(formData.get("password") ?? "");

    // Validation: Check password strength (minimum 8 characters)
    if (password.length < 8) {
        return { errorMessage: "Password must be at least 8 characters long" };
    }

    const supabase = await createClient();

    // Update the user's password
    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { errorMessage: error.message };
    }

    // Sign out the user after password reset for security
    // They must log in with their new password
    await supabase.auth.signOut();

    return { errorMessage: null };
}

/*
* Sign Out Action
*/
export const signOutAction = async () => {
    try {
        await protectRoute();

        const { auth } = await createClient();

        const { error } = await auth.signOut();

        if (error) throw error;

        return { errorMessage: null };
    } catch (error) {
        return { errorMessage: getErrorMessage(error) };
    }
};
