import { createClient } from '@/utils/supabase/server';
import { Application, ApplicationStatus, ApplicationInsert } from '@/types';

/**
 * Get an application by ID
 */
export async function getApplicationById(applicationId: number): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('application_id', applicationId)
        .single();

    if (error) {
        console.error('Error fetching application:', error);
        return null;
    }
    return data;
}

export async function getAppliedJobs(jobSeekerId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('application')
    .select(`
      job_id,
      is_bookmark,
      status,
      created_at,
      job:job_id (
        job_id,
        job_title,
        job_location,
        job_type,
        created_at,
        recruiter (
          recruiter_id,
          company:company_id (
            comp_name
          )
        )
      )
    `)
    .eq('job_seeker_id', jobSeekerId)
    .neq('status', 'unknown')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applied jobs:', error);
    return [];
  }

  return (
    data?.map((a: any) => ({
      jobId: a.job?.job_id,
      compLogo: a.job?.recruiter?.company?.comp_logo || '/default-company.png',
      compName: a.job?.recruiter?.company?.comp_name || 'Unknown Company',
      jobTitle: a.job?.job_title,
      jobLocation: a.job?.job_location,
      jobType: a.job?.job_type,
      createdAt: new Date(a.job?.created_at).toLocaleDateString(),
      bookmark: a.is_bookmark ?? false,
      status: a.status,
    })) || []
  );
}

/**
 * Get applications by job seeker ID
 */
export async function getApplicationsByJobSeekerId(jobSeekerId: number): Promise<Application[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('job_seeker_id', jobSeekerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications by job seeker:', error);
        return [];
    }
    return data || [];
}

/**
 * Get applications by job ID
 */
export async function getApplicationsByJobId(jobId: number): Promise<Application[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications by job:', error);
        return [];
    }
    return data || [];
}

/**
 * Get bookmarked applications by job seeker
 */
export async function getBookmarkedApplications(jobSeekerId: number): Promise<Application[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('job_seeker_id', jobSeekerId)
        .eq('is_bookmark', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bookmarked applications:', error);
        return [];
    }
    return data || [];
}

export async function getBookmarkedJobs(jobSeekerId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('application')
    .select(`
      job_id,
      is_bookmark,
      created_at,
      job:job_id (
        job_id,
        job_title,
        job_location,
        job_type,
        created_at,
        recruiter (
          recruiter_id,
          company:company_id (
            comp_name
          )
        )
      )
    `)
    .eq('job_seeker_id', jobSeekerId)
    .eq('is_bookmark', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarked jobs:', error);
    return [];
  }

  return (
    data?.map((a: any) => ({
      jobId: a.job?.job_id,
      compLogo: a.job?.recruiter?.company?.comp_logo || '/default-company.png',
      compName: a.job?.recruiter?.company?.comp_name || 'Unknown Company',
      jobTitle: a.job?.job_title,
      jobLocation: a.job?.job_location,
      jobType: a.job?.job_type,
      createdAt: new Date(a.job?.created_at).toLocaleDateString(),
      bookmark: true,
    })) || []
  );
}

/**
 * Create a new application
 */
export async function createApplication(application: ApplicationInsert): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .insert(application)
        .select()
        .single();

    if (error) {
        console.error('Error creating application:', error);
        return null;
    }
    return data;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(applicationId: number, status: ApplicationStatus): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .update({ status })
        .eq('application_id', applicationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating application status:', error);
        return null;
    }
    return data;
}

/**
 * Toggle bookmark status
 */
export async function toggleBookmark(applicationId: number, isBookmark: boolean): Promise<Application | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('application')
        .update({ is_bookmark: isBookmark })
        .eq('application_id', applicationId)
        .select()
        .single();

    if (error) {
        console.error('Error toggling bookmark:', error);
        return null;
    }
    return data;
}

/**
 * Delete an application
 */
export async function deleteApplication(applicationId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('application')
        .delete()
        .eq('application_id', applicationId);

    if (error) {
        console.error('Error deleting application:', error);
        return false;
    }
    return true;
}

/**
 * Get a single application by job seeker + job
 */
export async function getApplicationByJobAndSeeker(
  jobSeekerId: number,
  jobId: number
): Promise<Application | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application")
    .select("*")
    .eq("job_seeker_id", jobSeekerId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching application by job & seeker:", error);
    return null;
  }
  return data;
}

/**
 * Create a bookmark-only application record
 */
export async function createBookmarkApplication(
  jobSeekerId: number,
  jobId: number,
  status?: ApplicationStatus
): Promise<Application | null> {
  const supabase = await createClient();

  try {
    // 1️⃣ Try to find profile resume
    const { data: resume, error: resumeError } = await supabase
      .from("resume")
      .select("resume_id")
      .eq("job_seeker_id", jobSeekerId)
      .eq("is_profile", true)
      .maybeSingle();

    if (resumeError) {
      console.error("Error fetching resume:", resumeError);
      return null;
    }

    // 2️⃣ Build insert payload
    const payload: any = {
      job_seeker_id: jobSeekerId,
      job_id: jobId,
      is_bookmark: true,
      status: status || 'unknown',
    };

    // Only include resume_id if found
    if (resume?.resume_id) {
      payload.resume_id = resume.resume_id;
    }

    // 3️⃣ Insert new record
    const { data, error } = await supabase
      .from("application")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error creating bookmark application:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error in createBookmarkApplication:", err);
    return null;
  }
}
