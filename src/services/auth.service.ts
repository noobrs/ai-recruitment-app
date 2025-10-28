import { createClient } from '@/utils/supabase/server';
import { User } from '@/types';

export type UserRole = 'job_seeker' | 'recruiter';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return null;
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

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
    return role === 'job_seeker';
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
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user || user.role !== 'job_seeker') {
        return null;
    }

    const { data, error } = await supabase
        .from('job_seeker')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching job seeker:', error);
        return null;
    }

    return data;
}

/**
 * Get recruiter profile for current user
 */
export async function getCurrentRecruiter() {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user || user.role !== 'recruiter') {
        return null;
    }

    const { data, error } = await supabase
        .from('recruiter')
        .select('*, company:company_id(*)')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching recruiter:', error);
        return null;
    }

    return data;
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
