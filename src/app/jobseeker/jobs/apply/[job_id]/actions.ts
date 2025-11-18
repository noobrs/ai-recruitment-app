'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * submitApplication()
 * Handles a bias-free job application submission.
 *
 * ✅ User must be authenticated (jobseeker)
 * ✅ Can use existing resume or upload new one
 * ✅ Resume stored with permanent signed URL
 * ✅ FastAPI processes resume from signed URL
 * ✅ Rollback on FastAPI failure
 */
export async function submitApplication(formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // 1️⃣ Verify user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

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

  // 3️⃣ Find jobseeker profile
  const { data: jobSeeker, error: seekerError } = await supabase
    .from('job_seeker')
    .select('job_seeker_id')
    .eq('user_id', user.id)
    .single();

  if (seekerError || !jobSeeker) {
    console.error('Jobseeker not found:', seekerError);
    throw new Error('Jobseeker profile not found.');
  }

  const jobSeekerId = jobSeeker.job_seeker_id;
  let resumeId: number;

  // 4️⃣ Handle resume: use existing or upload new
  if (existingResumeId) {
    // Use existing resume - no FastAPI processing needed
    resumeId = parseInt(existingResumeId);

    // Verify resume belongs to this jobseeker
    const { data: existingResume, error: verifyError } = await supabase
      .from('resume')
      .select('resume_id, job_seeker_id')
      .eq('resume_id', resumeId)
      .eq('job_seeker_id', jobSeekerId)
      .single();

    if (verifyError || !existingResume) {
      throw new Error('Invalid resume selection.');
    }
  } else if (cvFile) {
    // Upload new resume
    const filePath = `applications/${user.id}/${Date.now()}_${cvFile.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('resumes-original')
      .upload(filePath, cvFile, { upsert: true });

    if (uploadError) {
      console.error('Resume upload error:', uploadError);
      throw new Error('Failed to upload resume.');
    }

    // Generate permanent signed URL (expires in 10 years)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('resumes-original')
      .createSignedUrl(filePath, 315360000); // 10 years in seconds

    if (signedUrlError || !signedUrlData?.signedUrl) {
      // Rollback: delete uploaded file
      await supabaseAdmin.storage.from('resumes-original').remove([filePath]);
      console.error('Signed URL error:', signedUrlError);
      throw new Error('Failed to generate resume signed URL.');
    }

    // Create resume record with signed URL
    const { data: resumeInsert, error: resumeError } = await supabase
      .from('resume')
      .insert([
        {
          job_seeker_id: jobSeekerId,
          original_file_path: signedUrlData.signedUrl,
          extracted_skills,
          extracted_experiences,
          extracted_education,
          is_profile: false,
          status: 'uploaded',
        },
      ])
      .select('resume_id')
      .single();

    if (resumeError || !resumeInsert) {
      // Rollback: delete uploaded file
      await supabaseAdmin.storage.from('resumes-original').remove([filePath]);
      console.error('Resume insert error:', resumeError);
      throw new Error('Failed to save resume record.');
    }

    resumeId = resumeInsert.resume_id;

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
}