'use server';

import { revalidatePath } from 'next/cache';
import { updateUser } from '@/services/user.service';
import { updateRecruiter } from '@/services/recruiter.service';
import { UserUpdate, RecruiterUpdate } from '@/types';

/**
 * Update user profile (name, etc.)
 */
export async function updateUserProfile(userId: string, data: UserUpdate) {
    try {
        const result = await updateUser(userId, data);
        if (!result) {
            throw new Error('Failed to update user profile');
        }
        revalidatePath('/recruiter/profile');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Update recruiter profile (position, company_id)
 */
export async function updateRecruiterProfile(recruiterId: number, data: RecruiterUpdate) {
    try {
        const result = await updateRecruiter(recruiterId, data);
        if (!result) {
            throw new Error('Failed to update recruiter profile');
        }
        revalidatePath('/recruiter/profile');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating recruiter profile:', error);
        throw error;
    }
}
