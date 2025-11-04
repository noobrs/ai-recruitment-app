"use server";

import { createClient, protectRoute } from "@/utils/supabase/server";
import type { UserRole } from "@/types";
import { getErrorMessage } from "@/utils/utils";
import { updateUserRole } from "@/services/user.service";
import { redirect } from 'next/navigation';

/*
* Google SSO Action
*/
export const googleSignInAction = async (role: UserRole) => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?role=${role}`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.url) {
        // Return URL for client-side redirect instead of server redirect
        return { url: data.url };
    }

    return { error: 'Failed to initiate Google sign in' };
};

/*
* Register Action
*/
export async function registerAction(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const role = String(formData.get("role") ?? "jobseeker") as UserRole;

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
        // Check if user already exists with this email via auth.users
        // We'll attempt to sign up and handle the error if user exists

        // Register new user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback?role=${role}&next=/${role}/dashboard`,
                data: {
                    role,
                    email_confirm: false // User must verify email
                },
            },
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
                        emailRedirectTo: `${origin}/auth/callback?role=${role}&next=/${role}/dashboard`,
                    },
                });

                if (!resendError) {
                    // Successfully resent - they probably didn't verify
                    redirect(`/auth/verify/${role}?email=${encodeURIComponent(email)}`);
                }

                // If resend failed, user is likely already verified
                return { errorMessage: "This email is already registered. Please login instead." };
            }
            return { errorMessage: authError.message };
        }

        if (!authData.user) {
            return { errorMessage: "Registration failed. Please try again." };
        }

        // Set role in public.users table via trigger
        // The trigger should handle this, but we'll ensure it's set correctly
        // Note: The trigger creates the user row when auth.users is inserted
        // We need to ensure the role is set even when user is in pending state

        // Wait a brief moment for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify and update role if needed
        const { data: userData } = await supabase
            .from('users')
            .select('id, role, status')
            .eq('id', authData.user.id)
            .maybeSingle();

        if (!userData || userData.role !== role) {
            // Update role if not set correctly by trigger
            await updateUserRole(authData.user.id, role);
        }

        // Redirect to verification page with role
        redirect(`/auth/verify/${role}?email=${encodeURIComponent(email)}`);

    } catch (error) {
        console.error('Registration error:', error);
        return { errorMessage: "An unexpected error occurred. Please try again." };
    }
}

/*
* Log In Action
*/
export async function loginAction(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "jobseeker") as UserRole;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { errorMessage: error.message };
    }

    // Optional: role-aware post-login routing can be done on client or here by returning a URL
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
