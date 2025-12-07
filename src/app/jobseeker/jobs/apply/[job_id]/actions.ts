'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { saveResumeToDatabase } from '@/app/actions/resume.actions';
import { ResumeData } from '@/types/fastapi.types';
import { getAuthenticatedJobSeeker } from '@/services/auth.service';
import { verifyResumeOwnership } from '@/services/resume.service';
import { getJobById } from '@/services/job.service';
import { getRecruiterById } from '@/services/recruiter.service';
import { getCompanyById } from '@/services/company.service';
import { getUserById } from '@/services/user.service';
import { notifyJobApplicationSubmitted, notifyNewApplicationReceived } from '@/utils/notification-helper';
import { createAdminClient } from '@/utils/supabase/admin';
import { hasActiveApplication } from '@/services/application.service';

/**
 * Check if jobseeker has an active application for this job
 */
export async function checkActiveApplication(jobId: string) {
  try {
    const jobSeekerId = await getAuthenticatedJobSeeker();
    const hasActive = await hasActiveApplication(jobSeekerId, parseInt(jobId));
    return { hasActive };
  } catch (error) {
    console.error('Error checking active application:', error);
    return { hasActive: false, error: 'Failed to check application status' };
  }
}

/**
 * submitApplication()
 * Handles a bias-free job application submission.
 *
 * ✅ User must be authenticated (jobseeker)
 * ✅ Can use existing resume or upload new one with extracted data
 * ✅ Resume saved to storage with format: [jobseeker_id]/unique_filename
 * ✅ Generates long-lived signed URL for resume access
 * ✅ Sends email and notification to jobseeker
 * ✅ Sends email and notification to recruiter
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
  const redacted_file_url = formData.get('redacted_file_url')?.toString() || null;

  if (!jobId) {
    throw new Error('Missing required job ID.');
  }

  // 2.5️⃣ Check if jobseeker already has an active application for this job
  const hasActive = await hasActiveApplication(jobSeekerId, parseInt(jobId));
  if (hasActive) {
    throw new Error('You already have an active application for this job.');
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

    const result = await saveResumeToDatabase(cvFile, extractedData, false, redacted_file_url);
    resumeId = result.resume.resume_id;
  } else {
    throw new Error('Either existing resume or new resume with extracted data is required.');
  }

  // 5️⃣ Check if application exists (e.g., from bookmark)
  const { data: existingApp } = await supabase
    .from('application')
    .select('application_id, status')
    .eq('job_id', jobId)
    .eq('job_seeker_id', jobSeekerId)
    .maybeSingle();

  let application;

  // Only update if the existing application is a bookmark (status = 'unknown')
  // For withdrawn or other statuses, create a new application to preserve history
  if (existingApp && existingApp.status === 'unknown') {
    // Update existing bookmark application (convert bookmark to real application)
    const { data, error: appError } = await supabase
      .from('application')
      .update({
        resume_id: resumeId,
        match_score: null,
        status: 'received',
        is_bookmark: true, // Keep bookmark status
      })
      .eq('application_id', existingApp.application_id)
      .select()
      .single();

    if (appError || !data) {
      console.error('Application update error:', appError);
      throw new Error('Failed to submit application.');
    }
    application = data;
  } else {
    // Insert new application record (either no existing app, or existing app was withdrawn/rejected)
    const { data, error: appError } = await supabase
      .from('application')
      .insert([
        {
          job_id: jobId,
          job_seeker_id: jobSeekerId,
          resume_id: resumeId,
          match_score: null,
          status: 'received',
        },
      ])
      .select()
      .single();

    if (appError || !data) {
      console.error('Application insert error:', appError);
      throw new Error('Failed to submit application.');
    }
    application = data;
  }

  // 6️⃣ Call ranking API to compute match score
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const rankingResponse = await fetch(`${apiUrl}/api/py/rank/application/${application.application_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!rankingResponse.ok) {
      throw new Error(`Ranking API returned ${rankingResponse.status}`);
    }

    const rankingResult = await rankingResponse.json();
    console.log('Application ranked successfully:', rankingResult);
  } catch (rankingError) {
    // Don't fail the application submission if ranking fails
    console.error('Error ranking application:', rankingError);
  }

  // 7️⃣ Get necessary data for notifications and emails
  try {
    const supabaseAdmin = createAdminClient();
    // Get job details
    const job = await getJobById(parseInt(jobId));
    if (!job) throw new Error('Job not found');

    // Get recruiter details
    const recruiter = await getRecruiterById(job.recruiter_id);
    if (!recruiter) throw new Error('Recruiter not found');

    // Get company details
    const company = await getCompanyById(recruiter.company_id);
    if (!company) throw new Error('Company not found');

    // Get jobseeker user details
    const { data: jobSeekerData } = await supabase
      .from('job_seeker')
      .select('user_id')
      .eq('job_seeker_id', jobSeekerId)
      .single();

    if (!jobSeekerData) throw new Error('Job seeker not found');

    const jobSeekerUser = await getUserById(jobSeekerData.user_id);
    if (!jobSeekerUser) throw new Error('Job seeker user not found');

    // Get jobseeker email from auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const jobSeekerEmail = authUser?.email;
    if (!jobSeekerEmail) throw new Error('Job seeker email not found');

    // Get recruiter user details
    const recruiterUser = await getUserById(recruiter.user_id);
    if (!recruiterUser) throw new Error('Recruiter user not found');

    // Get recruiter email from auth
    const { data: { user: recruiterAuthUser } } = await supabaseAdmin.auth.admin.getUserById(recruiter.user_id);
    const recruiterEmail = recruiterAuthUser?.email;
    if (!recruiterEmail) throw new Error('Recruiter email not found');

    // 8️⃣ Send notification and email to job seeker
    const jobSeekerName = `${jobSeekerUser.first_name || ''} ${jobSeekerUser.last_name || ''}`.trim() || 'Job Seeker';
    const applicationDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await notifyJobApplicationSubmitted({
      userId: jobSeekerData.user_id,
      userEmail: jobSeekerEmail,
      type: 'application',
      applicationId: application.application_id,
      userName: jobSeekerName,
      jobTitle: job.job_title,
      companyName: company.comp_name,
      applicationDate: applicationDate,
    });

    // 9️⃣ Send notification and email to recruiter
    const recruiterName = `${recruiterUser.first_name || ''} ${recruiterUser.last_name || ''}`.trim() || 'Recruiter';

    await notifyNewApplicationReceived({
      userId: recruiter.user_id,
      userEmail: recruiterEmail,
      type: 'application',
      applicationId: application.application_id,
      recruiterName: recruiterName,
      jobTitle: job.job_title,
      applicantName: jobSeekerName,
      applicationDate: applicationDate,
    });

    console.log('Notifications and emails sent successfully');
  } catch (notificationError) {
    // Don't fail the application submission if notifications fail
    console.error('Error sending notifications:', notificationError);
  }

  // 🔟 Revalidate paths
  revalidatePath('/jobseeker/jobs');
  revalidatePath('/jobseeker/applications');

  return { success: true };
}