'use server';

import { createClient } from '@/utils/supabase/server';
import { ResumeData, EducationOut, ExperienceOut } from '@/types/fastapi.types';
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
 * @param redactedFileUrl - Optional signed URL of the redacted resume from FastAPI
 * @returns The created resume record
 */
export async function saveResumeToDatabase(
    file: File,
    extractedData: ResumeData,
    isProfile: boolean = false,
    redactedFileUrl?: string | null
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
                redacted_file_path: redactedFileUrl || null,
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

/**
 * Update resume skills
 * 
 * @param resumeId - The resume ID to update
 * @param skills - The updated skills array
 * @returns Success status
 */
export async function updateResumeSkills(resumeId: number, skills: string[]) {
    try {
        const supabase = await createClient();
        const jobSeekerId = await getAuthenticatedJobSeeker();

        // Verify ownership
        const { data: resume } = await supabase
            .from('resume')
            .select('job_seeker_id')
            .eq('resume_id', resumeId)
            .single();

        if (!resume || resume.job_seeker_id !== jobSeekerId) {
            throw new Error('Unauthorized');
        }

        const { error } = await supabase
            .from('resume')
            .update({ extracted_skills: JSON.stringify(skills) })
            .eq('resume_id', resumeId);

        if (error) throw error;

        return {
            success: true,
            message: 'Skills updated successfully'
        };
    } catch (error) {
        console.error('Error updating resume skills:', error);
        throw error;
    }
}

/**
 * Update resume experience
 * 
 * @param resumeId - The resume ID to update
 * @param experiences - The updated experiences array
 * @returns Success status
 */
export async function updateResumeExperience(resumeId: number, experiences: ExperienceOut[]) {
    try {
        const supabase = await createClient();
        const jobSeekerId = await getAuthenticatedJobSeeker();

        // Verify ownership
        const { data: resume } = await supabase
            .from('resume')
            .select('job_seeker_id')
            .eq('resume_id', resumeId)
            .single();

        if (!resume || resume.job_seeker_id !== jobSeekerId) {
            throw new Error('Unauthorized');
        }

        const { error } = await supabase
            .from('resume')
            .update({ extracted_experiences: JSON.stringify(experiences) })
            .eq('resume_id', resumeId);

        if (error) throw error;

        return {
            success: true,
            message: 'Experience updated successfully'
        };
    } catch (error) {
        console.error('Error updating resume experience:', error);
        throw error;
    }
}

/**
 * Update resume education
 * 
 * @param resumeId - The resume ID to update
 * @param education - The updated education array
 * @returns Success status
 */
export async function updateResumeEducation(resumeId: number, education: EducationOut[]) {
    try {
        const supabase = await createClient();
        const jobSeekerId = await getAuthenticatedJobSeeker();

        // Verify ownership
        const { data: resume } = await supabase
            .from('resume')
            .select('job_seeker_id')
            .eq('resume_id', resumeId)
            .single();

        if (!resume || resume.job_seeker_id !== jobSeekerId) {
            throw new Error('Unauthorized');
        }

        const { error } = await supabase
            .from('resume')
            .update({ extracted_education: JSON.stringify(education) })
            .eq('resume_id', resumeId);

        if (error) throw error;

        return {
            success: true,
            message: 'Education updated successfully'
        };
    } catch (error) {
        console.error('Error updating resume education:', error);
        throw error;
    }
}