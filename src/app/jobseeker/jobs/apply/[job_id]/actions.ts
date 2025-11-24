'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { saveResumeToDatabase } from '@/app/actions/resume.actions';
import { ResumeData } from '@/types/fastapi.types';
import { getAuthenticatedJobSeeker } from '@/services/auth.service';
import { verifyResumeOwnership } from '@/services/resume.service';

/**
 * submitApplication()
 * Handles a bias-free job application submission.
 *
 * ✅ User must be authenticated (jobseeker)
 * ✅ Can use existing resume or upload new one with extracted data
 * ✅ Resume saved to storage with format: [jobseeker_id]/unique_filename
 * ✅ Generates long-lived signed URL for resume access
 */
export async function submitApplication(formData: FormData) {
  const supabase = await createClient();

  // 1️⃣ Verify user session and get jobseeker profile
  const jobSeekerId = await getAuthenticatedJobSeeker();

  // 2️⃣ Extract form fields
  const jobId = formData.get('job_id')?.toString();
  const existingResumeId = formData.get('existing_resume_id')?.toString();
  const cvFile = formData.get('cvFile') as File | null;
  const extracted_skills = formData.get('extracted_skills')?.toString();
  const extracted_experiences = formData.get('extracted_experiences')?.toString();
  const extracted_education = formData.get('extracted_education')?.toString();

  if (!jobId) {
    throw new Error('Missing required job ID.');
  }

  let resumeId: number;

  // 3️⃣ Handle resume: use existing or create new
  if (existingResumeId) {
    // Use existing resume - verify ownership
    resumeId = parseInt(existingResumeId);
    await verifyResumeOwnership(resumeId, jobSeekerId);
  } else if (cvFile && extracted_skills && extracted_experiences && extracted_education) {
    // Create new resume with extracted data using shared function
    const extractedData: ResumeData = {
      candidate: { name: null, email: null, phone: null, location: null },
      skills: JSON.parse(extracted_skills),
      experience: JSON.parse(extracted_experiences),
      education: JSON.parse(extracted_education),
      certifications: [],
      activities: [],
    };

    const result = await saveResumeToDatabase(cvFile, extractedData, false);
    resumeId = result.resume.resume_id;
  } else {
    throw new Error('Either existing resume or new resume with extracted data is required.');
  }

  // 5️⃣ Insert application record
  const { error: appError } = await supabase.from('application').insert([
    {
      job_id: jobId,
      job_seeker_id: jobSeekerId,
      resume_id: resumeId,
      match_score: null,
      status: 'received',
    },
  ]);

  if (appError) {
    console.error('Application insert error:', appError);
    throw new Error('Failed to submit application.');
  }

  // 6️⃣ Revalidate paths
  revalidatePath('/jobseeker/jobs');
  revalidatePath('/jobseeker/applications');

  return { success: true };
}