"use server";

import { updateJob } from "@/services/job.service";
import { getCurrentRecruiter } from "@/services";
import {
  createJobRequirement,
  updateJobRequirement,
  deleteJobRequirement,
  getRequirementsByJobId
} from "@/services/job-requirement.service";

type JobRequirementInput = {
  job_requirement_id?: number;
  type: string;
  requirement: string;
  weightage: number;
};

export async function updateJobAction(
  jobId: number,
  updates: any,
  requirements: JobRequirementInput[] = []
) {
  const user = await getCurrentRecruiter();
  if (!user) return { success: false, error: "Unauthorized recruiter." };

  // Update job details
  const updated = await updateJob(jobId, updates);

  if (!updated) {
    return { success: false, error: "Failed to update job." };
  }

  // Handle requirements update
  try {
    // Fetch existing requirements
    const existingRequirements = await getRequirementsByJobId(jobId);
    const existingIds = new Set(existingRequirements.map(r => r.job_requirement_id));
    const newRequirementIds = new Set(
      requirements
        .filter(r => r.job_requirement_id)
        .map(r => r.job_requirement_id!)
    );

    // Delete requirements that are no longer in the list
    for (const existing of existingRequirements) {
      if (!newRequirementIds.has(existing.job_requirement_id)) {
        await deleteJobRequirement(existing.job_requirement_id);
      }
    }

    // Update existing or create new requirements
    for (const req of requirements) {
      if (req.job_requirement_id && existingIds.has(req.job_requirement_id)) {
        // Update existing requirement
        await updateJobRequirement(req.job_requirement_id, {
          requirement: req.requirement,
          type: req.type,
          weightage: req.weightage,
        });
      } else {
        // Create new requirement
        await createJobRequirement({
          job_id: jobId,
          requirement: req.requirement,
          type: req.type,
          weightage: req.weightage,
        });
      }
    }
  } catch (error) {
    console.error("Error updating requirements:", error);
    return { success: false, error: "Failed to update job requirements." };
  }

  return { success: true };
}
