import { createClient } from '@/utils/supabase/server';
import { User, UserInsert, UserUpdate } from '@/types';

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
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
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
