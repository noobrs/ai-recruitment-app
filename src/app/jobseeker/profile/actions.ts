'use server';

import { revalidatePath } from 'next/cache';
import { updateUser } from '@/services/user.service';
import { updateJobSeeker } from '@/services/jobseeker.service';
import { setAsProfileResume } from '@/services/resume.service';

interface UserProfileUpdate {
    first_name?: string;
    last_name?: string;
}

interface JobSeekerProfileUpdate {
    location?: string;
    about_me?: string;
}

/**
 * Update user profile (name, etc.)
 */
export async function updateUserProfile(userId: string, data: UserProfileUpdate) {
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
export async function updateJobSeekerProfile(jobSeekerId: number, data: JobSeekerProfileUpdate) {
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
