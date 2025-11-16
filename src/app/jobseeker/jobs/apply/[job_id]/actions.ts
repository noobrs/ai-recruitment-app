'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * submitApplication()
 * Handles a bias-free job application submission.
 *
 * ✅ User must be authenticated (jobseeker)
 * ✅ Resume file is mandatory
 * ✅ Resume saved to Storage + resume table
 * ✅ Application links job, jobseeker, and resume
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

  // 2️⃣ Extract basic form fields
  const jobId = formData.get('job_id')?.toString();
  const cvFile = formData.get('cvFile') as File | null;
  const extracted_skills = formData.get('extracted_skills')?.toString();
  const extracted_experiences = formData.get('extracted_experiences')?.toString();
  const extracted_education = formData.get('extracted_education')?.toString();

  if (!jobId || !cvFile) {
    throw new Error('Missing required job or resume file.');
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

  // 4️⃣ Upload resume file to Supabase Storage
  const filePath = `applications/${user.id}/${Date.now()}_${cvFile.name}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('resumes-original')
    .upload(filePath, cvFile, { upsert: true });

  if (uploadError) {
    console.error('Resume upload error:', uploadError);
    throw new Error('Failed to upload resume.');
  }

  // 5️⃣ Create a resume record in the database
  const { data: resumeInsert, error: resumeError } = await supabase
    .from('resume')
    .insert([
      {
        job_seeker_id: jobSeekerId,
        original_file_path: filePath,
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
    console.error('Resume insert error:', resumeError);
    throw new Error('Failed to save resume record.');
  }

  const resumeId = resumeInsert.resume_id;

  // 5️⃣ (TODO) Call external ranking model to get match score
  // await supabase
  // .from('application')
  // .update({ match_score: calculatedScore })
  // .eq('application_id', id);


  // 6️⃣ Insert new application record
  const { error: appError } = await supabase.from('application').insert([
    {
      job_id: jobId,
      job_seeker_id: jobSeekerId,
      resume_id: resumeId,
      match_score: null, // to be updated later by ranking model
      status: 'received',
    },
  ]);

  if (appError) {
    console.error('Application insert error:', appError);
    throw new Error('Failed to submit application.');
  }

  // 7️⃣ Optional: trigger revalidation of profile or job list
  revalidatePath('/jobseeker/job');

  return { success: true };
}
