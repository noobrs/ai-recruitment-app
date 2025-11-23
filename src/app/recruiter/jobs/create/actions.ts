"use server";

import { createJob } from "@/services/job.service";
import { getCurrentRecruiter } from "@/services";
import { JobInsert } from "@/types";
import { createMultipleRequirements } from "@/services/job-requirement.service";

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

  // Handle job requirements if provided
  const requirementsData = formData.get("requirements") as string;
  if (requirementsData) {
    try {
      const requirements = JSON.parse(requirementsData);

      if (Array.isArray(requirements) && requirements.length > 0) {
        const jobRequirements = requirements.map((req) => ({
          job_id: newJob.job_id,
          requirement: req.requirement,
          type: req.type,
          weightage: req.weightage / 10,
        }));

        await createMultipleRequirements(jobRequirements);
      }
    } catch (error) {
      console.error("Error creating job requirements:", error);
      // Don't fail the entire job creation if requirements fail
    }
  }

  return { success: true };
}