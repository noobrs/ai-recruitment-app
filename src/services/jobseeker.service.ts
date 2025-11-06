import { createClient } from '@/utils/supabase/server';
import { JobSeeker, JobSeekerInsert, JobSeekerUpdate } from '@/types';

/**
 * Get a job seeker by ID
 */
export async function getJobSeekerById(jobSeekerId: number): Promise<JobSeeker | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_seeker')
        .select('*')
        .eq('job_seeker_id', jobSeekerId)
        .single();

    if (error) {
        console.error('Error fetching job seeker:', error);
        return null;
    }
    return data;
}

/**
 * Get a job seeker by user ID
 */
export async function getJobSeekerByUserId(userId: string): Promise<JobSeeker | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_seeker')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching job seeker by user ID:', error);
        return null;
    }
    return data;
}

/**
 * Get all job seekers
 */
export async function getAllJobSeekers(): Promise<JobSeeker[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_seeker')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching job seekers:', error);
        return [];
    }
    return data || [];
}

/**
 * Create a new job seeker
 */
export async function createJobSeeker(jobSeeker: JobSeekerInsert): Promise<JobSeeker | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_seeker')
        .insert(jobSeeker)
        .select()
        .single();

    if (error) {
        console.error('Error creating job seeker:', error);
        return null;
    }
    return data;
}

/**
 * Update a job seeker
 */
export async function updateJobSeeker(jobSeekerId: number, updates: JobSeekerUpdate): Promise<JobSeeker | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_seeker')
        .update(updates)
        .eq('job_seeker_id', jobSeekerId)
        .select()
        .single();

    if (error) {
        console.error('Error updating job seeker:', error);
        return null;
    }
    return data;
}

/**
 * Delete a job seeker
 */
export async function deleteJobSeeker(jobSeekerId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_seeker')
        .delete()
        .eq('job_seeker_id', jobSeekerId);

    if (error) {
        console.error('Error deleting job seeker:', error);
        return false;
    }
    return true;
}

/**
 * Get full job seeker details joined with user table
 */
export async function getFullJobSeekerByUserId(userId: string): Promise<any | null> {
  const supabase = await createClient();

  // We assume: job_seeker.user_id → users.id
  const { data, error } = await supabase
    .from("job_seeker")
    .select(`
      *,
      user:user_id (
        id,
        first_name,
        last_name,
        status,
        role,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching full job seeker profile:", error);
    return null;
  }

  return data;
}
