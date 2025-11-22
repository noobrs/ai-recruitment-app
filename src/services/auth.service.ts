import { createClient } from '@/utils/supabase/server';
import type { BaseUser, UserRole } from '@/types';
import { getUserById } from './user.service';
import { getJobSeekerByUserId } from './jobseeker.service';
import { getRecruiterByUserId } from './recruiter.service';

/**
 * Get the current authenticated user (Server-Side Only)
 * 
 * Uses Supabase server client with cookies for authentication.
 * Always fetches fresh data from the database.
 * 
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(): Promise<BaseUser | null> {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return null;
    }

    // Use user service to get user data
    const user = await getUserById(authUser.id);
    return { ...authUser, ...user } as BaseUser;
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
    const user = await getCurrentUser();
    return user?.role as UserRole | null;
}

/**
 * Check if current user is a job seeker
 */
export async function isJobSeeker(): Promise<boolean> {
    const role = await getCurrentUserRole();
    return role === 'jobseeker';
}

/**
 * Check if current user is a recruiter
 */
export async function isRecruiter(): Promise<boolean> {
    const role = await getCurrentUserRole();
    return role === 'recruiter';
}

/**
 * Get current user with job seeker profile (Server-Side Only)
 * 
 * Use this in Server Components and Server Actions to get fresh auth data.
 * Always fetches from database with current session cookies.
 * 
 * @returns User with job_seeker profile or null if not authenticated/not a job seeker
 */
export async function getCurrentJobSeeker() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'jobseeker') {
        return null;
    }

    // Use jobseeker service to get profile
    const jobSeeker = await getJobSeekerByUserId(user.id);

    // Return user with job seeker profile
    return {
        ...user,
        job_seeker: jobSeeker
    };
}

/**
 * Get current user with recruiter profile (Server-Side Only)
 * 
 * Use this in Server Components and Server Actions to get fresh auth data.
 * Always fetches from database with current session cookies.
 * 
 * @returns User with recruiter profile or null if not authenticated/not a recruiter
 * @example
 */
export async function getCurrentRecruiter() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'recruiter') {
        return null;
    }

    // Use recruiter service to get profile
    const recruiter = await getRecruiterByUserId(user.id);

    // Return user with recruiter profile
    return {
        ...user,
        recruiter: recruiter
    };
}

/**
 * Get the authenticated user's job seeker profile
 * @throws Error if user is not authenticated or job seeker profile not found
 * @returns The job seeker ID
 */
export async function getAuthenticatedJobSeeker() {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Get jobseeker profile
    const { data: jobSeeker, error: seekerError } = await supabase
        .from('job_seeker')
        .select('job_seeker_id')
        .eq('user_id', user.id)
        .single();

    if (seekerError || !jobSeeker) {
        throw new Error('Jobseeker profile not found');
    }

    return jobSeeker.job_seeker_id;
}

/**
 * Get the authenticated user and their job seeker profile
 * @throws Error if user is not authenticated or job seeker profile not found
 * @returns Object containing user and job seeker ID
 */
export async function getAuthenticatedJobSeekerWithUser() {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Get jobseeker profile
    const { data: jobSeeker, error: seekerError } = await supabase
        .from('job_seeker')
        .select('job_seeker_id')
        .eq('user_id', user.id)
        .single();

    if (seekerError || !jobSeeker) {
        throw new Error('Jobseeker profile not found');
    }

    return {
        user,
        jobSeekerId: jobSeeker.job_seeker_id,
    };
}

/**
 * Get the authenticated user's recruiter profile
 * @throws Error if user is not authenticated or recruiter profile not found
 * @returns The recruiter ID
 */
export async function getAuthenticatedRecruiter() {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Get recruiter profile
    const { data: recruiter, error: recruiterError } = await supabase
        .from('recruiter')
        .select('recruiter_id')
        .eq('user_id', user.id)
        .single();

    if (recruiterError || !recruiter) {
        throw new Error('Recruiter profile not found');
    }

    return recruiter.recruiter_id;
}

/**
 * Sign out
 */
export async function signOut() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error signing out:', error);
        return false;
    }

    return true;
}
