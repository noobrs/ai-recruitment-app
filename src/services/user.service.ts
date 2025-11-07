import { createClient } from '@/utils/supabase/server';
import { User, UserInsert, UserRole, UserStatus, UserUpdate } from '@/types';

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }
    return data;
}

/**
 * Get a user by email (from auth.users)
 * Note: Email is stored in auth.users, not public.users
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const supabase = await createClient();

    // First get the user from auth.users by email
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error fetching auth users:', authError);
        return null;
    }

    const authUser = users?.find(u => u.email === email);

    if (!authUser) {
        return null;
    }

    // Now get the user from public.users by id
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }
    return data;
}

/**
 * Create a new user
 */
export async function createUser(user: UserInsert): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

    if (error) {
        console.error('Error creating user:', error);
        return null;
    }
    return data;
}

/**
 * Update a user
 */
export async function updateUser(userId: string, updates: UserUpdate): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        return null;
    }
    return data;
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: 'jobseeker' | 'recruiter'): Promise<User | null> {
    return updateUser(userId, { role });
}

/**
 * Update user status
 */
export async function updateUserStatus(userId: string, status: 'pending' | 'active' | 'inactive'): Promise<User | null> {
    return updateUser(userId, { status });
}

/**
 * Get user with role and status check
 */
export async function getUserWithRoleStatus(userId: string): Promise<{ role: UserRole | null; status: UserStatus | null } | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user role and status:', error);
        return null;
    }
    return data;
}

/**
 * Get user with role only
 */
export async function getUserRole(userId: string): Promise<{ role: string | null } | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
    return data;
}

/**
 * Get user with basic profile info
 */
export async function getUserProfile(userId: string): Promise<{ role: string | null; status: string | null; first_name: string | null; last_name: string | null } | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('role, status, first_name, last_name')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
}

/**
 * Get user status for verification check
 */
export async function getUserStatus(userId: string): Promise<{ id: string; status: UserStatus } | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('id, status')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user status:', error);
        return null;
    }
    return data;
}




