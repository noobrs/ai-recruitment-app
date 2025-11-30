import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getJobById } from "@/services/job.service";
import { getRequirementsByJobId } from "@/services/job-requirement.service";

export async function GET(
  req: Request,
  { params }: { params: { job_id: string } }
) {
  try {
    const supabase = await createClient();

    // Validate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jobId = Number(params.job_id);

    // Fetch basic job details
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch requirements
    const requirements = await getRequirementsByJobId(jobId);

    return NextResponse.json({
      job,
      requirements: requirements || [],
    });
  } catch (err: any) {
    console.error("Error fetching job edit data:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
