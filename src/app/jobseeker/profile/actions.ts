'use server';

import { revalidatePath } from 'next/cache';
import { updateUser } from '@/services/user.service';
import { updateJobSeeker } from '@/services/jobseeker.service';
import { setAsProfileResume } from '@/services/resume.service';
import { createClient } from '@/utils/supabase/server';
import { UserUpdate, JobSeekerUpdate, ApiResponse, ResumeData, isSuccessResponse } from '@/types';
import { fetchFromFastAPI } from '@/utils/api';

/**
 * Update user profile (name, etc.)
 */
export async function updateUserProfile(userId: string, data: UserUpdate) {
    try {
        const result = await updateUser(userId, data);
        if (!result) {
            throw new Error('Failed to update user profile');
        }
        revalidatePath('/jobseeker/profile');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Update job seeker profile (location, about_me)
 */
export async function updateJobSeekerProfile(jobSeekerId: number, data: JobSeekerUpdate) {
    try {
        const result = await updateJobSeeker(jobSeekerId, data);
        if (!result) {
            throw new Error('Failed to update job seeker profile');
        }
        revalidatePath('/jobseeker/profile');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating job seeker profile:', error);
        throw error;
    }
}

/**
 * Set a resume as profile resume
 */
export async function setProfileResume(jobSeekerId: number, resumeId: number) {
    try {
        const result = await setAsProfileResume(jobSeekerId, resumeId);
        if (!result) {
            throw new Error('Failed to set profile resume');
        }
        revalidatePath('/jobseeker/profile');
        return { success: true };
    } catch (error) {
        console.error('Error setting profile resume:', error);
        throw error;
    }
}

/**
 * Upload a resume to profile
 * This is a two-step process:
 * 1. Extract resume data via FastAPI (no DB save)
 * 2. Save to database when user confirms
 * 
 * This function now only handles the extraction part
 * Use saveResumeToDatabase from resume.actions.ts to save
 */
export async function uploadResumeToProfile(formData: FormData) {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    const jobSeekerId = parseInt(formData.get('job_seeker_id')?.toString() || '0');
    const file = formData.get('file') as File;

    if (!file || !jobSeekerId) {
        throw new Error('Missing required fields');
    }

    try {
        // Extract resume data via FastAPI (multipart upload)
        const extractFormData = new FormData();
        extractFormData.append('file', file);

        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        const endpoint = isPdf ? '/api/py/process-pdf' : '/api/py/process-image';

        const response = (await fetchFromFastAPI(endpoint, {
            method: 'POST',
            body: extractFormData,
        })) as ApiResponse<ResumeData>;

        if (!isSuccessResponse(response) || !response.data) {
            throw new Error(response.message || 'Failed to extract resume data');
        }

        // Return extracted data without saving to database
        // The frontend will handle saving via saveResumeToDatabase
        return {
            success: true,
            extractedData: response.data,
            redactedFileUrl: response.redacted_file_url,
            message: 'Resume extracted successfully. Please review and save.',
        };
    } catch (error) {
        console.error('Error extracting resume:', error);
        throw error;
    }
}
