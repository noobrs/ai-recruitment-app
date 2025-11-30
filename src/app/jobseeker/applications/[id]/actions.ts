'use server';

import { createClient } from '@/utils/supabase/server';
import { withdrawApplication as withdrawApplicationService } from '@/services/application.service';
import { getAuthenticatedJobSeeker } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

/**
 * Withdraw an application (job seeker can withdraw their own application)
 * 
 * @param applicationId - The application ID to withdraw
 * @returns Success status with message
 */
export async function withdrawApplication(applicationId: number) {
    try {
        const jobSeekerId = await getAuthenticatedJobSeeker();

        // Call the service to withdraw the application
        const result = await withdrawApplicationService(applicationId, jobSeekerId);

        if (!result) {
            return {
                success: false,
                error: 'Failed to withdraw application. Application may not exist or has already been withdrawn/rejected.'
            };
        }

        // Revalidate paths to update the UI
        revalidatePath('/jobseeker/applications');
        revalidatePath('/jobseeker/jobs');
        revalidatePath(`/jobseeker/applications/${applicationId}`);

        return {
            success: true,
            message: 'Application withdrawn successfully',
            application: result
        };
    } catch (error) {
        console.error('Error withdrawing application:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to withdraw application'
        };
    }
}
