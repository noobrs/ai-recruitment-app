import { createClient } from '@/utils/supabase/server';
import { logError } from '@/utils/logger';
import type { Job, Recruiter, Company, JobRequirement } from '@/types';

export type JobWithRelations = Job & {
  recruiter?: Recruiter & {
    company?: Company | null;
  };
  job_requirement?: JobRequirement[];
};

// Type for the formatted response from /api/recruiter/jobs
export type RecruiterJobItem = {
  job_id: number;
  title: string;
  location: string;
  type: string;
  date: string;
  status: string;
  recruiter_id: number | null;
  company: {
    name: string;
    logo: string;
    location: string;
  };
};

export async function getAllJobsWithRelations(): Promise<JobWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job')
    .select(`
      *,
      recruiter (
        recruiter_id,
        position,
        company:company_id (
          company_id,
          comp_name,
          comp_industry,
          comp_website
        )
      ),
      job_requirement (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    logError('getAllJobsWithRelations', error);
    return [];
  }

  return data || [];
}
