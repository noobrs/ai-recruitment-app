import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
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

/**
 * Verify that a resume belongs to a specific job seeker
 * @throws Error if resume not found or access denied
 */
export async function verifyResumeOwnership(resumeId: number, jobSeekerId: number): Promise<Resume> {
    const supabase = await createClient();

    const { data: resume, error } = await supabase
        .from('resume')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('job_seeker_id', jobSeekerId)
        .single();

    if (error || !resume) {
        throw new Error('Resume not found or access denied');
    }

    return resume;
}

/**
 * Unset all profile resumes for a job seeker
 * Used before setting a new profile resume
 */
export async function unsetAllProfileResumes(jobSeekerId: number): Promise<void> {
    const supabase = await createClient();

    await supabase
        .from('resume')
        .update({ is_profile: false })
        .eq('job_seeker_id', jobSeekerId);
}

/**
 * Upload a file to Supabase Storage
 * @returns The file path in storage
 * @throws Error if upload fails
 */
export async function uploadResumeFile(
    file: File,
    jobSeekerId: number
): Promise<string> {
    const supabaseAdmin = createAdminClient();

    // Generate unique filename: [jobseeker_id]/unique_filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${jobSeekerId}/${uniqueFilename}`;

    const { error: uploadError } = await supabaseAdmin.storage
        .from('resumes-original')
        .upload(filePath, file, { upsert: false });

    if (uploadError) {
        console.error('Resume upload error:', uploadError);
        throw new Error('Failed to upload resume to storage');
    }

    return filePath;
}

/**
 * Generate a long-lived signed URL for a file in storage
 * @param filePath The path to the file in storage
 * @returns The signed URL (valid for 10 years)
 * @throws Error if URL generation fails
 */
export async function generateSignedUrl(filePath: string): Promise<string> {
    const supabaseAdmin = createAdminClient();

    // Generate long-lived signed URL (10 years)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from('resumes-original')
        .createSignedUrl(filePath, 315360000); // 10 years in seconds

    if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error('Failed to generate signed URL');
    }

    return signedUrlData.signedUrl;
}

/**
 * Delete a file from Supabase Storage
 * Used for cleanup in case of errors
 */
export async function deleteResumeFile(filePath: string): Promise<void> {
    const supabaseAdmin = createAdminClient();

    await supabaseAdmin.storage
        .from('resumes-original')
        .remove([filePath]);
}

/**
 * Mark a resume as deleted by updating its status
 * @param resumeId The resume ID to mark as deleted
 * @param jobSeekerId The job seeker ID to verify ownership
 * @throws Error if resume not found or update fails
 */
export async function markResumeAsDeleted(resumeId: number, jobSeekerId: number): Promise<void> {
    const supabase = await createClient();

    // Verify ownership
    await verifyResumeOwnership(resumeId, jobSeekerId);

    // Update resume status to 'deleted'
    const { error: updateError } = await supabase
        .from('resume')
        .update({
            status: 'deleted',
            is_profile: false,  // Remove profile status if it was set
            updated_at: new Date().toISOString()
        })
        .eq('resume_id', resumeId);

    if (updateError) {
        throw new Error('Failed to delete resume');
    }
}
