"use server";

import { updateJob } from "@/services/job.service";
import { getCurrentRecruiter } from "@/services";

export async function updateJobAction(jobId: number, updates: any) {
  const user = await getCurrentRecruiter();
  if (!user) return { success: false, error: "Unauthorized recruiter." };

  const updated = await updateJob(jobId, updates);

  if (!updated) {
    return { success: false, error: "Failed to update job." };
  }

  return { success: true };
}
