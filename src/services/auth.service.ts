/**
 * Auth Service - Server-Side Authentication
 * 
 * These functions are designed for Server Components and Server Actions.
 * They use Supabase server client with cookies for authentication.
 * 
 * Architecture:
 * - Server Components: Use these functions for fresh auth checks
 * - Client Components: Use AuthContext for cached auth state
 * - API Routes: Use these functions for auth validation
 * 
 * DO NOT call these from client components - use useAuthContext() instead.
 */

import { createClient } from '@/utils/supabase/server';
import { User } from '@/types';
import { getUserById } from './user.service';
import { getJobSeekerByUserId } from './jobseeker.service';
import { getRecruiterByUserId } from './recruiter.service';

export type UserRole = 'jobseeker' | 'recruiter';

/**
 * Get the current authenticated user (Server-Side Only)
 * 
 * Uses Supabase server client with cookies for authentication.
 * Always fetches fresh data from the database.
 * 
 * @returns User object or null if not authenticated
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
 * Get current user with job seeker profile (Server-Side Only)
 * 
 * Use this in Server Components and Server Actions to get fresh auth data.
 * Always fetches from database with current session cookies.
 * 
 * @returns User with job_seeker profile or null if not authenticated/not a job seeker
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function JobSeekerProfilePage() {
 *   const jobSeeker = await getCurrentJobSeeker();
 *   if (!jobSeeker) redirect('/auth/jobseeker/login');
 *   return <ProfileContent user={jobSeeker} />;
 * }
 * ```
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
 * ```tsx
 * // In a Server Component
 * export default async function RecruiterDashboardPage() {
 *   const recruiter = await getCurrentRecruiter();
 *   if (!recruiter) redirect('/auth/recruiter/login');
 *   return <DashboardContent user={recruiter} />;
 * }
 * ```
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
