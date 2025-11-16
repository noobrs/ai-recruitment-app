"use server";

import { createJob } from "@/services/job.service";
import { getCurrentRecruiter } from "@/services";
import { JobInsert } from "@/types";

export async function createJobAction(formData: FormData) {
  const user = await getCurrentRecruiter();
  const recruiterId = user?.recruiter?.recruiter_id;

  if (!recruiterId) {
    return { success: false, error: "Unauthorized recruiter." };
  }

  const job: JobInsert = {
    recruiter_id: recruiterId,
    job_title: formData.get("job_title") as string,
    job_description: formData.get("job_description") as string,
    job_location: formData.get("job_location") as string,
    job_type: formData.get("job_type") as string,
    job_mode: formData.get("job_mode") as string,
    job_industry: formData.get("job_industry") as string,
    salary_range: formData.get("salary_range") as string,
    job_status: "open",
  };

  const newJob = await createJob(job);

  if (!newJob) {
    return { success: false, error: "Failed to create job." };
  }

  return { success: true };
}