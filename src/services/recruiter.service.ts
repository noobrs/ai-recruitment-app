import { createClient } from '@/utils/supabase/server';
import { Recruiter } from '@/types';

/**
 * Get a recruiter by ID
 */
export async function getRecruiterById(recruiterId: number): Promise<Recruiter | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('recruiter')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .single();

    if (error) {
        console.error('Error fetching recruiter:', error);
        return null;
    }
    return data;
}

/**
 * Get a recruiter by user ID
 */
export async function getRecruiterByUserId(userId: string): Promise<Recruiter | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('recruiter')
        .select('*, company:company_id(*)')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching recruiter by user ID:', error);
        return null;
    }
    return data;
}

/**
 * Get recruiters by company ID
 */
export async function getRecruitersByCompanyId(companyId: number): Promise<Recruiter[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('recruiter')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recruiters by company:', error);
        return [];
    }
    return data || [];
}

/**
 * Create a new recruiter
 */
export async function createRecruiter(recruiter: {
    user_id: string;
    company_id: number;
    position?: string | null;
}): Promise<Recruiter | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('recruiter')
        .insert(recruiter)
        .select()
        .single();

    if (error) {
        console.error('Error creating recruiter:', error);
        return null;
    }
    return data;
}

/**
 * Update a recruiter
 */
export async function updateRecruiter(recruiterId: number, updates: {
    company_id?: number;
    position?: string | null;
}): Promise<Recruiter | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('recruiter')
        .update(updates)
        .eq('recruiter_id', recruiterId)
        .select()
        .single();

    if (error) {
        console.error('Error updating recruiter:', error);
        return null;
    }
    return data;
}

/**
 * Delete a recruiter
 */
export async function deleteRecruiter(recruiterId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('recruiter')
        .delete()
        .eq('recruiter_id', recruiterId);

    if (error) {
        console.error('Error deleting recruiter:', error);
        return false;
    }
    return true;
}
