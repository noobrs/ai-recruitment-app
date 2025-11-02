'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
    getCurrentUser,
    updateUserRole,
    getUserWithRoleStatus,
    updateUser,
    updateUserStatus,
    createJobSeeker,
    createRecruiter
} from '@/services';

export type SignUpData = {
    email: string;
    password: string;
};

export type OnboardingData = {
    firstName: string;
    lastName: string;
};

export type JobSeekerOnboardingData = OnboardingData & {
    location?: string;
    aboutMe?: string;
};

export type RecruiterOnboardingData = OnboardingData & {
    companyId: number;
    position?: string;
};

/**
 * Phase 1: Sign up (Auth Only)
 * Creates auth user and triggers auto-creation of basic user record
 * Does NOT create role-specific profile yet
 */
export async function signUpWithEmail(email: string, password: string, role: 'jobseeker' | 'recruiter') {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // Add role parameter to callback URL for proper redirect after email verification
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?role=${role}`,
            data: {
                role: role, // Store intended role in user metadata
            },
        },
    });

    if (authError || !authData.user) {
        return { error: authError?.message || 'Failed to create account' };
    }

    // Set role immediately in public.users (even in pending state)
    // This allows login to work before onboarding is complete
    if (authData.user) {
        await updateUserRole(authData.user.id, role);
    }

    // Database trigger will auto-create public.users record with status='pending'
    // User will be redirected to onboarding after email verification

    return {
        success: true,
        needsEmailVerification: !authData.session, // No session means email verification needed
        message: 'Please check your email to verify your account'
    };
}

/**
 * Phase 2: Complete Job Seeker Onboarding
 * Creates user profile and job seeker record after auth is complete
 */
export async function completeJobSeekerOnboarding(data: JobSeekerOnboardingData) {
    // Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
        return { error: 'Not authenticated. Please log in again.' };
    }

    // Check if already onboarded
    if (user.status === 'active' && user.role === 'jobseeker') {
        redirect('/jobseeker/dashboard');
    }

    // Update user record with complete profile
    // Role should already be set from registration, but ensure it's 'jobseeker'
    const updatedUser = await updateUser(user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'jobseeker', // Ensure role is set (in case it wasn't)
        status: 'pending', // Still pending until job_seeker record is created
    });

    if (!updatedUser) {
        return { error: 'Failed to update profile' };
    }

    // Create job seeker profile
    const jobSeeker = await createJobSeeker({
        user_id: user.id,
        location: data.location,
        about_me: data.aboutMe,
    });

    if (!jobSeeker) {
        // Rollback user update
        await updateUser(user.id, { status: 'pending' });
        return { error: 'Failed to create job seeker profile' };
    }

    // Mark onboarding as complete
    await updateUserStatus(user.id, 'active');

    redirect('/jobseeker/dashboard');
}

/**
 * Phase 2: Complete Recruiter Onboarding
 * Creates user profile and recruiter record after auth is complete
 */
export async function completeRecruiterOnboarding(data: RecruiterOnboardingData) {
    // Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
        return { error: 'Not authenticated. Please log in again.' };
    }

    // Check if already onboarded
    if (user.status === 'active' && user.role === 'recruiter') {
        redirect('/recruiter/dashboard');
    }

    // Update user record with complete profile
    const updatedUser = await updateUser(user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'recruiter',
        status: 'pending',
    });

    if (!updatedUser) {
        return { error: 'Failed to update profile' };
    }

    // Create recruiter profile
    const recruiter = await createRecruiter({
        user_id: user.id,
        company_id: data.companyId,
        position: data.position,
    });

    if (!recruiter) {
        // Rollback user update
        await updateUser(user.id, { status: 'pending' });
        return { error: 'Failed to create recruiter profile' };
    }

    // Mark onboarding as complete
    await updateUserStatus(user.id, 'active');

    redirect('/recruiter/dashboard');
}

/**
 * Sign in (works for both roles)
 */
export async function signIn(email: string, password: string, expectedRole?: 'jobseeker' | 'recruiter') {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError || !authData.user) {
        return { error: authError?.message || 'Invalid credentials' };
    }

    // Get user role and status
    const user = await getUserWithRoleStatus(authData.user.id);

    // Verify role if expected role is provided
    if (expectedRole && user?.role !== expectedRole) {
        await supabase.auth.signOut();
        return { error: `Please use the ${expectedRole.replace('_', ' ')} login` };
    }

    // Check if onboarding is complete
    if (user?.status === 'pending') {
        // User registered but hasn't completed onboarding
        const rolePath = user.role === 'recruiter' ? 'recruiter' : 'jobseeker';
        redirect(`/auth/${rolePath}/onboarding`);
    }

    // Redirect based on role
    if (user?.role === 'jobseeker') {
        redirect('/jobseeker/dashboard');
    } else if (user?.role === 'recruiter') {
        redirect('/recruiter/dashboard');
    }

    redirect('/');
}

/**
 * Sign in with Google OAuth
 * This initiates the OAuth flow and returns the URL for client-side redirect
 */
export async function signInWithGoogle(role: 'jobseeker' | 'recruiter') {
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
}
