import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
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
      application_id,
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
    .neq('status', 'withdrawn')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applied jobs:', error);
    return [];
  }

  return (
    data?.map((a: any) => ({
      applicationId: a.application_id,
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

  // Remove duplicates by job_id, keeping the most recent one
  const uniqueJobs = new Map();
  data?.forEach((a: any) => {
    if (!uniqueJobs.has(a.job_id)) {
      uniqueJobs.set(a.job_id, a);
    }
  });

  return (
    Array.from(uniqueJobs.values()).map((a: any) => ({
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
 * Check if job seeker has an active application for a specific job
 * Active means status is 'received' or 'shortlisted'
 */
export async function hasActiveApplication(jobSeekerId: number, jobId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('application')
    .select('application_id, status')
    .eq('job_seeker_id', jobSeekerId)
    .eq('job_id', jobId)
    .in('status', ['received', 'shortlisted'])
    .maybeSingle();

  if (error) {
    console.error('Error checking active application:', error);
    return false;
  }

  return !!data;
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
 * Withdraw an application (jobseeker can withdraw their own application)
 */
export async function withdrawApplication(applicationId: number, jobSeekerId: number): Promise<Application | null> {
  const supabase = await createClient();

  // Verify ownership and current status
  const { data: existing, error: fetchError } = await supabase
    .from('application')
    .select('application_id, status, job_seeker_id')
    .eq('application_id', applicationId)
    .eq('job_seeker_id', jobSeekerId)
    .single();

  if (fetchError || !existing) {
    console.error('Application not found or unauthorized:', fetchError);
    return null;
  }

  // Don't allow withdrawing already rejected/withdrawn applications
  if (existing.status === 'rejected' || existing.status === 'withdrawn') {
    console.error('Cannot withdraw application with status:', existing.status);
    return null;
  }

  // Update status to withdrawn
  const { data, error } = await supabase
    .from('application')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('application_id', applicationId)
    .select()
    .single();

  if (error) {
    console.error('Error withdrawing application:', error);
    return null;
  }
  return data;
}

/**
 * Toggle bookmark status for ALL existing records of a job-seeker combination
 */
export async function toggleBookmark(jobSeekerId: number, jobId: number, isBookmark: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('application')
    .update({ is_bookmark: isBookmark })
    .eq('job_seeker_id', jobSeekerId)
    .eq('job_id', jobId);

  if (error) {
    console.error('Error toggling bookmark:', error);
    return false;
  }
  return true;
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
 * Returns the most recent application for the job-seeker pair
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
    .order("created_at", { ascending: false })
    .limit(1)
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

/**
 * Count applications by job_id (excluding 'unknown' status)
 */
export async function countApplicationsByJobId(jobId: number): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("application")
    .select("application_id", { count: "exact", head: true })
    .eq("job_id", jobId)
    .neq("status", "unknown");

  if (error) {
    console.error("Error counting applications:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get all applicants for a recruiter (joined with job, job_seeker, and resume)
 */
export async function getApplicantsByRecruiter(
  recruiterId: number,
  statuses?: string[]
) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // First, get all job IDs for this recruiter
  const { data: jobs, error: jobError } = await supabase
    .from("job")
    .select("job_id")
    .eq("recruiter_id", recruiterId);

  if (jobError) {
    console.error("Error fetching jobs:", jobError);
    return [];
  }

  if (!jobs || jobs.length === 0) {
    console.log("No jobs found for recruiter:", recruiterId);
    return [];
  }

  const jobIds = jobs.map(j => j.job_id);

  // Then query applications for those jobs
  let query = supabase
    .from("application")
    .select(`
      application_id,
      job_id,
      job_seeker_id,
      match_score,
      status,
      created_at,
      job:job_id (job_title, recruiter_id),
      job_seeker:job_seeker_id (
        job_seeker_id,
        user: user_id (
          id,
          first_name,
          last_name
        )
      ),
      resume:resume_id (
        resume_id,
        extracted_skills,
        redacted_file_path
      )
    `)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  // Filter by statuses
  if (statuses && statuses.length > 0) {
    query = query.in("status", statuses);
  } else {
    query = query.neq("status", "unknown");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching recruiter applicants:", error);
    return [];
  }

  // Fetch emails for all job seekers
  const userIds = data?.map((a: any) => a.job_seeker?.user?.id).filter(Boolean) || [];
  const emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    try {
      // Fetch emails in batches to avoid overwhelming the API
      const { data: { users }, error: emailError } = await supabaseAdmin.auth.admin.listUsers();

      if (!emailError && users) {
        users.forEach(user => {
          if (userIds.includes(user.id) && user.email) {
            emailMap[user.id] = user.email;
          }
        });
      }
    } catch (emailError) {
      console.error("Error fetching user emails:", emailError);
    }
  }

  return (
    data?.map((a: any) => {
      const userId = a.job_seeker?.user?.id;
      return {
        id: a.application_id,
        applicantName: `${a.job_seeker?.user?.first_name || ""} ${a.job_seeker?.user?.last_name || ""}`.trim() || "Unknown",
        applicantEmail: userId ? (emailMap[userId] || null) : null,
        jobTitle: a.job?.job_title || "Untitled Job",
        date: new Date(a.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        score: a.match_score ?? 0,
        status: a.status || "received",
        redactedResumeUrl: a.resume?.redacted_file_path || null,
      };
    }) || []
  );
}

/**
 * Get applicants by job ID (for recruiter job view)
 */
export async function getApplicantsByJobIdForRecruiter(
  jobId: string,
  sortOrder: "asc" | "desc" = "desc"
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application")
    .select(
      `
      application_id,
      job_seeker_id,
      match_score,
      status,
      created_at,
      job_seeker:job_seeker_id (
        job_seeker_id,
        user:user_id (
          first_name,
          last_name
        )
      ),
      resume:resume_id (
        resume_id,
        redacted_file_path
      )
    `
    )
    .eq("job_id", jobId)
    .neq("status", "unknown")
    .order("match_score", { ascending: sortOrder === "asc" });

  if (error) {
    console.error("Error fetching job applicants:", error);
    return [];
  }

  return (
    data?.map((a: any) => ({
      id: a.application_id,
      applicantName:
        `${a.job_seeker?.user?.first_name || ""} ${a.job_seeker?.user?.last_name || ""}`.trim() ||
        "Unknown",
      date: new Date(a.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      score: a.match_score ?? 0,
      status: a.status || "received",
      redactedResumeUrl: a.resume?.redacted_file_path || null,
    })) || []
  );
}