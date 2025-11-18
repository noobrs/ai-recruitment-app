'use server';

import { revalidatePath } from 'next/cache';
import { updateUser } from '@/services/user.service';
import { updateJobSeeker } from '@/services/jobseeker.service';
import { setAsProfileResume } from '@/services/resume.service';
import { createAdminClient } from '@/utils/supabase/admin';
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
 */
export async function uploadResumeToProfile(formData: FormData) {
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

    const jobSeekerId = parseInt(formData.get('job_seeker_id')?.toString() || '0');
    const file = formData.get('file') as File;

    if (!file || !jobSeekerId) {
        throw new Error('Missing required fields');
    }

    let uploadedFilePath: string | null = null;

    try {
        // Upload file to Supabase Storage
        const filePath = `profiles/${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('resumes-original')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Resume upload error:', uploadError);
            throw new Error('Failed to upload resume.');
        }

        uploadedFilePath = filePath;

        // Generate permanent signed URL (expires in 10 years)
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from('resumes-original')
            .createSignedUrl(filePath, 315360000); // 10 years in seconds

        if (signedUrlError || !signedUrlData?.signedUrl) {
            throw new Error('Failed to generate resume signed URL.');
        }

        // Create resume record with signed URL
        const { data: resumeInsert, error: resumeError } = await supabase
            .from('resume')
            .insert([
                {
                    job_seeker_id: jobSeekerId,
                    original_file_path: signedUrlData.signedUrl,
                    is_profile: false,
                    status: 'uploaded',
                },
            ])
            .select('resume_id')
            .single();

        if (resumeError || !resumeInsert) {
            throw new Error('Failed to save resume record.');
        }

        // Call FastAPI to process resume
        try {
            const isPdf = file.name.toLowerCase().endsWith('.pdf');
            const endpoint = isPdf ? '/api/py/process-pdf' : '/api/py/process-image';

            const apiPayload = new FormData();
            apiPayload.append('signed_url', signedUrlData.signedUrl);

            const response = (await fetchFromFastAPI(endpoint, {
                method: 'POST',
                body: apiPayload,
            })) as ApiResponse<ResumeData>;

            if (isSuccessResponse(response)) {
                const data = response.data;

                if (data) {
                    // Update resume with extracted data
                    const { data: updateResult, error: updateError } = await supabase
                        .from('resume')
                        .update({
                            extracted_skills: JSON.stringify(data.skills || []),
                            extracted_experiences: JSON.stringify(data.experience || []),
                            extracted_education: JSON.stringify(data.education || []),
                            status: 'processed',
                        })
                        .eq('resume_id', resumeInsert.resume_id)
                        .select();

                    if (updateError) {
                        console.error('Error updating resume with extracted data:', updateError);
                        throw new Error(`Failed to update resume: ${updateError.message}`);
                    }

                    console.log('Resume updated successfully:', updateResult);
                } else {
                    console.warn('FastAPI returned success but no data');
                }
            } else {
                console.error('FastAPI returned non-success response:', response);
            }
        } catch (fastapiError) {
            console.error('FastAPI processing error (non-fatal):', fastapiError);
            // Don't rollback - resume is uploaded, just not processed yet
        }

        revalidatePath('/jobseeker/profile');
        return { success: true, resumeId: resumeInsert.resume_id };
    } catch (error) {
        // Rollback: delete uploaded file if it exists
        if (uploadedFilePath) {
            await supabaseAdmin.storage.from('resumes-original').remove([uploadedFilePath]);
        }
        console.error('Error uploading resume:', error);
        throw error;
    }
}
