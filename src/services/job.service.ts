import { createClient } from '@/utils/supabase/server';
import { Job, JobInsert, JobUpdate } from '@/types';

/**
 * Get a job by ID
 */
export async function getJobById(jobId: number): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .eq('job_id', jobId)
        .single();

    if (error) {
        console.error('Error fetching job:', error);
        return null;
    }
    return data;
}

/**
 * Get all jobs
 */
export async function getAllJobs(): Promise<Job[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
    return data || [];
}

/**
 * Get jobs by recruiter ID
 */
export async function getJobsByRecruiterId(recruiterId: number): Promise<Job[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs by recruiter:', error);
        return [];
    }
    return data || [];
}

/**
 * Get active jobs
 */
export async function getActiveJobs(): Promise<Job[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .eq('job_status', 'active')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching active jobs:', error);
        return [];
    }
    return data || [];
}

/**
 * Create a new job
 */
export async function createJob(job: JobInsert): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .insert(job)
        .select()
        .single();

    if (error) {
        console.error('Error creating job:', error);
        return null;
    }
    return data;
}

/**
 * Update a job
 */
export async function updateJob(jobId: number, updates: JobUpdate): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .update(updates)
        .eq('job_id', jobId)
        .select()
        .single();

    if (error) {
        console.error('Error updating job:', error);
        return null;
    }
    return data;
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job')
        .delete()
        .eq('job_id', jobId);

    if (error) {
        console.error('Error deleting job:', error);
        return false;
    }
    return true;
}
