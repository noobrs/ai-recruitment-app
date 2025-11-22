import { createClient } from '@/utils/supabase/server';
import { Resume, ResumeInsert, ResumeUpdate } from '@/types';

/**
 * Get a resume by ID
 */
export async function getResumeById(resumeId: number): Promise<Resume | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resume')
        .select('*')
        .eq('resume_id', resumeId)
        .single();

    if (error) {
        console.error('Error fetching resume:', error);
        return null;
    }
    return data;
}

/**
 * Get resumes by job seeker ID (excluding deleted resumes)
 */
export async function getResumesByJobSeekerId(jobSeekerId: number): Promise<Resume[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resume')
        .select('*')
        .eq('job_seeker_id', jobSeekerId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching resumes by job seeker:', error);
        return [];
    }
    return data || [];
}

/**
 * Get profile resume (is_profile = true, excluding deleted resumes)
 */
export async function getProfileResume(jobSeekerId: number): Promise<Resume | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resume')
        .select('*')
        .eq('job_seeker_id', jobSeekerId)
        .eq('is_profile', true)
        .neq('status', 'deleted')
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile resume:', error);
        return null;
    }
    return data;
}

/**
 * Create a new resume
 */
export async function createResume(resume: ResumeInsert): Promise<Resume | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resume')
        .insert(resume)
        .select()
        .single();

    if (error) {
        console.error('Error creating resume:', error);
        return null;
    }
    return data;
}

/**
 * Update a resume
 */
export async function updateResume(resumeId: number, updates: ResumeUpdate): Promise<Resume | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('resume')
        .update(updates)
        .eq('resume_id', resumeId)
        .select()
        .single();

    if (error) {
        console.error('Error updating resume:', error);
        return null;
    }
    return data;
}

/**
 * Set resume as profile
 */
export async function setAsProfileResume(jobSeekerId: number, resumeId: number): Promise<boolean> {
    const supabase = await createClient();

    // First, unset all other resumes as profile
    await supabase
        .from('resume')
        .update({ is_profile: false })
        .eq('job_seeker_id', jobSeekerId);

    // Then set the selected resume as profile
    const { error } = await supabase
        .from('resume')
        .update({ is_profile: true })
        .eq('resume_id', resumeId);

    if (error) {
        console.error('Error setting profile resume:', error);
        return false;
    }
    return true;
}

/**
 * Delete a resume
 */
export async function deleteResume(resumeId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('resume')
        .delete()
        .eq('resume_id', resumeId);

    if (error) {
        console.error('Error deleting resume:', error);
        return false;
    }
    return true;
}
