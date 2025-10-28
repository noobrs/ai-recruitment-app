import { createClient } from '@/utils/supabase/server';
import { Application } from '@/types';

/**
 * Get an application by ID
 */
export async function getApplicationById(applicationId: number): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('application_id', applicationId)
        .single();

    if (error) {
        console.error('Error fetching application:', error);
        return null;
    }
    return data;
}

/**
 * Get applications by job seeker ID
 */
export async function getApplicationsByJobSeekerId(jobSeekerId: number): Promise<Application[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('job_seeker_id', jobSeekerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications by job seeker:', error);
        return [];
    }
    return data || [];
}

/**
 * Get applications by job ID
 */
export async function getApplicationsByJobId(jobId: number): Promise<Application[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications by job:', error);
        return [];
    }
    return data || [];
}

/**
 * Get bookmarked applications by job seeker
 */
export async function getBookmarkedApplications(jobSeekerId: number): Promise<Application[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('job_seeker_id', jobSeekerId)
        .eq('is_bookmark', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bookmarked applications:', error);
        return [];
    }
    return data || [];
}

/**
 * Create a new application
 */
export async function createApplication(application: {
    job_id: number;
    job_seeker_id: number;
    resume_id: number;
    status?: string | null;
    match_score?: number | null;
    is_bookmark?: boolean | null;
}): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .insert(application)
        .select()
        .single();

    if (error) {
        console.error('Error creating application:', error);
        return null;
    }
    return data;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(applicationId: number, status: string): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .update({ status })
        .eq('application_id', applicationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating application status:', error);
        return null;
    }
    return data;
}

/**
 * Toggle bookmark status
 */
export async function toggleBookmark(applicationId: number, isBookmark: boolean): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .update({ is_bookmark: isBookmark })
        .eq('application_id', applicationId)
        .select()
        .single();

    if (error) {
        console.error('Error toggling bookmark:', error);
        return null;
    }
    return data;
}

/**
 * Delete an application
 */
export async function deleteApplication(applicationId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('application')
        .delete()
        .eq('application_id', applicationId);

    if (error) {
        console.error('Error deleting application:', error);
        return false;
    }
    return true;
}
