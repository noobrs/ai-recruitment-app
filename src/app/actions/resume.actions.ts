'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { ResumeData } from '@/types/fastapi.types';
import { randomUUID } from 'crypto';

/**
 * Save resume to database and storage
 * This is called after the user confirms they want to save the extracted resume
 * 
 * @param file - The resume file to upload
 * @param extractedData - The extracted resume data from FastAPI
 * @param isProfile - Whether this should be set as the profile resume
 * @returns The created resume record
 */
export async function saveResumeToDatabase(
    file: File,
    extractedData: ResumeData,
    isProfile: boolean = false
) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Get jobseeker profile
    const { data: jobSeeker, error: seekerError } = await supabase
        .from('job_seeker')
        .select('job_seeker_id')
        .eq('user_id', user.id)
        .single();

    if (seekerError || !jobSeeker) {
        throw new Error('Jobseeker profile not found');
    }

    const jobSeekerId = jobSeeker.job_seeker_id;
    let uploadedFilePath: string | null = null;

    try {
        // Generate unique filename: [jobseeker_id]/unique_filename
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${randomUUID()}.${fileExtension}`;
        const filePath = `${jobSeekerId}/${uniqueFilename}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from('resumes-original')
            .upload(filePath, file, { upsert: false });

        if (uploadError) {
            console.error('Resume upload error:', uploadError);
            throw new Error('Failed to upload resume to storage');
        }

        uploadedFilePath = filePath;

        // Generate long-lived signed URL (10 years)
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from('resumes-original')
            .createSignedUrl(filePath, 315360000); // 10 years in seconds

        if (signedUrlError || !signedUrlData?.signedUrl) {
            throw new Error('Failed to generate signed URL');
        }

        // If setting as profile resume, unset all other profile resumes
        if (isProfile) {
            await supabase
                .from('resume')
                .update({ is_profile: false })
                .eq('job_seeker_id', jobSeekerId);
        }

        // Create resume record with signed URL and extracted data
        const { data: resumeRecord, error: resumeError } = await supabase
            .from('resume')
            .insert({
                job_seeker_id: jobSeekerId,
                original_file_path: signedUrlData.signedUrl,
                extracted_skills: JSON.stringify(extractedData.skills || []),
                extracted_experiences: JSON.stringify(extractedData.experience || []),
                extracted_education: JSON.stringify(extractedData.education || []),
                is_profile: isProfile,
                status: 'processed',
            })
            .select()
            .single();

        if (resumeError || !resumeRecord) {
            throw new Error('Failed to create resume record');
        }

        return {
            success: true,
            resume: resumeRecord,
        };
    } catch (error) {
        // Rollback: delete uploaded file if it exists
        if (uploadedFilePath) {
            try {
                await supabaseAdmin.storage
                    .from('resumes-original')
                    .remove([uploadedFilePath]);
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded file:', cleanupError);
            }
        }
        console.error('Error saving resume:', error);
        throw error;
    }
}