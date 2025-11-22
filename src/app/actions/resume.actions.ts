'use server';

import { createClient } from '@/utils/supabase/server';
import { ResumeData } from '@/types/fastapi.types';
import { getAuthenticatedJobSeeker } from '@/services/auth.service';
import {
    markResumeAsDeleted,
    uploadResumeFile,
    generateSignedUrl,
    deleteResumeFile,
    unsetAllProfileResumes,
} from '@/services/resume.service';

/**
 * Delete resume by updating its status to 'deleted'
 * 
 * @param resumeId - The resume ID to delete
 * @returns Success status
 */
export async function deleteResume(resumeId: number) {
    try {
        const jobSeekerId = await getAuthenticatedJobSeeker();
        await markResumeAsDeleted(resumeId, jobSeekerId);

        return {
            success: true,
            message: 'Resume deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting resume:', error);
        throw error;
    }
}

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
    const jobSeekerId = await getAuthenticatedJobSeeker();
    let uploadedFilePath: string | null = null;

    try {
        // Upload file to Supabase Storage
        uploadedFilePath = await uploadResumeFile(file, jobSeekerId);

        // Generate long-lived signed URL
        const signedUrl = await generateSignedUrl(uploadedFilePath);

        // If setting as profile resume, unset all other profile resumes
        if (isProfile) {
            await unsetAllProfileResumes(jobSeekerId);
        }

        // Create resume record with signed URL and extracted data
        const { data: resumeRecord, error: resumeError } = await supabase
            .from('resume')
            .insert({
                job_seeker_id: jobSeekerId,
                original_file_path: signedUrl,
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
                await deleteResumeFile(uploadedFilePath);
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded file:', cleanupError);
            }
        }
        console.error('Error saving resume:', error);
        throw error;
    }
}