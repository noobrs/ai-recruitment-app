import { createClient } from '@/utils/supabase/server';
import { Job, JobInsert, JobUpdate, JobStatus } from '@/types';
import { logError, logInfo } from '@/utils/logger';
import { JobWithRelations } from '@/types/job.types';

/**
 * Get a job by ID
 */
export async function getJobById(jobId: number): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .eq('job_id', jobId)
        .single();

    if (error) {
        logError('getJobById', error);
        return null;
    }
    return data;
}

/**
 * Get all jobs
 */
export async function getAllJobs(): Promise<Job[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        logError('getAllJobs', error);
        return [];
    }
    return data || [];
}

/**
 * Get jobs by recruiter ID
 */
export async function getJobsByRecruiterId(recruiterId: number): Promise<Job[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

    if (error) {
        logError('getJobsByRecruiterId', error);
        return [];
    }
    return data || [];
}

/**
 * Get jobs by status
 */
export async function getJobsByStatus(status: JobStatus) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select('*')
        .eq('job_status', status)
        .order('created_at', { ascending: false });

    if (error) {
        logError('getJobsByStatus', error);
        return [];
    }

    return data || [];
}

/**
 * Get active jobs
 */
export async function getActiveJobs() {
    return getJobsByStatus('open');
}

/**
 * Create a new job
 */
export async function createJob(job: JobInsert): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .insert(job)
        .select()
        .single();

    if (error) {
        logError('createJob', error);
        return null;
    }
    return data;
}

/**
 * Update a job
 */
export async function updateJob(jobId: number, updates: JobUpdate): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .update(updates)
        .eq('job_id', jobId)
        .select()
        .single();

    if (error) {
        logError('updateJob', error);
        return null;
    }
    return data;
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job')
        .delete()
        .eq('job_id', jobId);

    if (error) {
        logError('deleteJob', error);
        return false;
    }
    return true;
}

export async function getAllJobsWithRelations(): Promise<JobWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job')
        .select(`
            *,
            recruiter (
                recruiter_id,
                position,
                company:company_id (*)
            ),
            job_requirement (*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs with relations:', error);
        return [];
    }
    return data || [];
}


/**
 * Fetch job details for recruiter view
 */
export async function getJobDetailsForRecruiter(jobId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job")
    .select(`
      job_id,
      job_title,
      job_type,
      job_location,
      job_status,
      created_at,
      recruiter:recruiter_id (
        recruiter_id,
        company:company_id (
          comp_name,
          comp_logo_path
        )
      )
    `)
    .eq("job_id", jobId)
    .single();

  if (error) {
    console.error("Error fetching job details:", error);
    return null;
  }

  const recruiter = Array.isArray(data.recruiter)
    ? data.recruiter[0]
    : data.recruiter;

  const company = recruiter?.company
    ? Array.isArray(recruiter.company)
      ? recruiter.company[0]
      : recruiter.company
    : null;

  return {
    id: data.job_id,
    title: data.job_title,
    type: data.job_type,
    location: data.job_location,
    status: data.job_status,
    date: new Date(data.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    company: company?.comp_name || "Unknown",
    compLogo: company?.comp_logo_path || "/default-company.png",
  };
}

