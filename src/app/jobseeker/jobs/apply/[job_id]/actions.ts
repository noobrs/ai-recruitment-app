'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * submitApplication()
 * Handles job application submission from the jobseeker.
 *
 * 1. Verifies session (jobseeker must be logged in)
 * 2. Uploads CV and optional extra file to Supabase Storage
 * 3. Inserts application record into the `application` table
 * 4. Returns success/failure response
 */
export async function submitApplication(formData: FormData) {
  const supabase = await createClient();

  // 1️⃣ Verify user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // 2️⃣ Extract form data
  const jobId = formData.get('job_id')?.toString();
  const firstName = formData.get('firstName')?.toString();
  const lastName = formData.get('lastName')?.toString();
  const email = formData.get('email')?.toString();
  const phoneNumber = formData.get('phoneNumber')?.toString();
  const coverLetter = formData.get('coverLetter')?.toString();
  const allowContact = formData.get('allowContact') === 'true';
  const cvFile = formData.get('cvFile') as File | null;
  const extraFile = formData.get('extraFile') as File | null;

  if (!jobId || !cvFile) {
    throw new Error('Missing required job or CV file.');
  }

  // 3️⃣ Find jobseeker ID
  const { data: jobSeeker, error: seekerError } = await supabase
    .from('job_seeker')
    .select('job_seeker_id')
    .eq('user_id', user.id)
    .single();

  if (seekerError || !jobSeeker) {
    throw new Error('Jobseeker profile not found.');
  }

  const jobSeekerId = jobSeeker.job_seeker_id;

  // 4️⃣ Upload CV to Supabase Storage
  const cvPath = `applications/${user.id}/${Date.now()}_${cvFile.name}`;
  const { error: cvUploadError } = await supabase.storage
    .from('resumes')
    .upload(cvPath, cvFile, { upsert: true });

  if (cvUploadError) {
    console.error('CV upload error:', cvUploadError);
    throw new Error('Failed to upload CV.');
  }

  // Optional: Upload extra file
  let extraPath: string | null = null;
  if (extraFile) {
    const path = `applications/${user.id}/${Date.now()}_${extraFile.name}`;
    const { error: extraUploadError } = await supabase.storage
      .from('resumes')
      .upload(path, extraFile, { upsert: true });

    if (extraUploadError) {
      console.error('Extra file upload error:', extraUploadError);
      throw new Error('Failed to upload additional file.');
    }

    extraPath = path;
  }

  // 5️⃣ Insert new record into `application` table
  const { error: insertError } = await supabase.from('application').insert([
    {
      job_id: jobId,
      job_seeker_id: jobSeekerId,
      resume_path: cvPath,
      extra_file_path: extraPath,
      cover_letter: coverLetter,
      email,
      phone_number: phoneNumber,
      allow_contact: allowContact,
      status: 'received',
    },
  ]);

  if (insertError) {
    console.error('Application insert error:', insertError);
    throw new Error('Failed to submit application.');
  }

  // 6️⃣ Revalidate profile (optional)
  revalidatePath('/jobseeker/profile');

  return { success: true };
}
