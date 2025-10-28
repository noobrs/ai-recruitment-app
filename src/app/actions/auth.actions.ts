'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export type SignUpData = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
};

export type JobSeekerSignUpData = SignUpData & {
    location?: string;
    aboutMe?: string;
};

export type RecruiterSignUpData = SignUpData & {
    companyId: number;
    position?: string;
};

/**
 * Sign up as job seeker
 */
export async function signUpJobSeeker(data: JobSeekerSignUpData) {
    const supabase = await createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
    });

    if (authError || !authData.user) {
        return { error: authError?.message || 'Failed to create account' };
    }

    // 2. Create user record with role
    const { error: userError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'job_seeker',
        });

    if (userError) {
        return { error: 'Failed to create user profile' };
    }

    // 3. Create job seeker profile
    const { error: jobSeekerError } = await supabase
        .from('job_seeker')
        .insert({
            user_id: authData.user.id,
            location: data.location,
            about_me: data.aboutMe,
        });

    if (jobSeekerError) {
        return { error: 'Failed to create job seeker profile' };
    }

    redirect('/jobseeker/dashboard');
}

/**
 * Sign up as recruiter
 */
export async function signUpRecruiter(data: RecruiterSignUpData) {
    const supabase = await createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
    });

    if (authError || !authData.user) {
        return { error: authError?.message || 'Failed to create account' };
    }

    // 2. Create user record with role
    const { error: userError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'recruiter',
        });

    if (userError) {
        return { error: 'Failed to create user profile' };
    }

    // 3. Create recruiter profile
    const { error: recruiterError } = await supabase
        .from('recruiter')
        .insert({
            user_id: authData.user.id,
            company_id: data.companyId,
            position: data.position,
        });

    if (recruiterError) {
        return { error: 'Failed to create recruiter profile' };
    }

    redirect('/recruiter/dashboard');
}

/**
 * Sign in (works for both roles)
 */
export async function signIn(email: string, password: string, expectedRole?: 'job_seeker' | 'recruiter') {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError || !authData.user) {
        return { error: authError?.message || 'Invalid credentials' };
    }

    // Get user role
    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

    // Verify role if expected role is provided
    if (expectedRole && user?.role !== expectedRole) {
        await supabase.auth.signOut();
        return { error: `Please use the ${expectedRole.replace('_', ' ')} login` };
    }

    // Redirect based on role
    if (user?.role === 'job_seeker') {
        redirect('/jobseeker/dashboard');
    } else if (user?.role === 'recruiter') {
        redirect('/recruiter/dashboard');
    }

    redirect('/');
}

/**
 * Sign in with Google OAuth
 * This initiates the OAuth flow and redirects to Google
 */
export async function signInWithGoogle(role: 'job_seeker' | 'recruiter') {
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
        redirect(data.url);
    }

    return { error: 'Failed to initiate Google sign in' };
}
