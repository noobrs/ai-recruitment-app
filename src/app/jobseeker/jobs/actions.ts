'use server';

import { revalidatePath } from 'next/cache';
import {
  getApplicationByJobAndSeeker,
  createBookmarkApplication,
  toggleBookmark as updateBookmarkState,
} from '@/services/application.service';

/**
 * Toggle or create a bookmark in the "application" table
 */
export async function toggleBookmark(jobSeekerId: number, jobId: number) {
  try {
    // 1️⃣ Check if an application exists
    const existing = await getApplicationByJobAndSeeker(jobSeekerId, jobId);

    if (existing) {
      // 2️⃣ Toggle is_bookmark
      const updated = await updateBookmarkState(
        existing.application_id,
        !existing.is_bookmark
      );

      if (!updated) throw new Error('Failed to update existing bookmark.');

      revalidatePath('/jobseeker/jobs');
      return { success: true, is_bookmark: updated.is_bookmark };
    }

    // 3️⃣ Otherwise, create new bookmark-only record
    const created = await createBookmarkApplication(jobSeekerId, jobId);
    if (!created) throw new Error('Failed to create bookmark.');

    revalidatePath('/jobseeker/jobs');
    return { success: true, is_bookmark: true };
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return { success: false, error: (error as Error).message };
  }
}
