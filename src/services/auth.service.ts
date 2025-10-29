import { createClient } from '@/utils/supabase/server';
import { User } from '@/types';
import { getUserById } from './user.service';
import { getJobSeekerByUserId } from './jobseeker.service';
import { getRecruiterByUserId } from './recruiter.service';

export type UserRole = 'jobseeker' | 'recruiter';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return null;
    }

    // Use user service to get user data
    const user = await getUserById(authUser.id);
    return user;
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
 * Get job seeker profile for current user
 */
export async function getCurrentJobSeeker() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'jobseeker') {
        return null;
    }

    // Use jobseeker service to get profile
    const jobSeeker = await getJobSeekerByUserId(user.id);
    return jobSeeker;
}

/**
 * Get recruiter profile for current user
 */
export async function getCurrentRecruiter() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'recruiter') {
        return null;
    }

    // Use recruiter service to get profile
    const recruiter = await getRecruiterByUserId(user.id);
    return recruiter;
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
