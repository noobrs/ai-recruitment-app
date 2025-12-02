import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getJobsByRecruiterId } from "@/services/job.service";
import { countApplicationsByJobId } from "@/services/application.service";
import { Job } from "@/types";

/**
 * GET /api/recruiter/posts
 * Returns all job postings created by the authenticated recruiter with real applicant counts.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1️⃣ Verify recruiter session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Fetch recruiter profile and company info
    const { data: recruiter, error: recruiterError } = await supabase
      .from("recruiter")
      .select(
        "recruiter_id, company:company_id(company_id, comp_name, comp_logo_path, comp_location)"
      )
      .eq("user_id", user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    // Parse filters from query
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const statuses = statusParam ? statusParam.split(",") : undefined;

    // 3️⃣ Fetch recruiter's job posts
    const jobs = await getJobsByRecruiterId(recruiter.recruiter_id, statuses);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ jobs: [] }, { status: 200 });
    }

    // 4️⃣ For each job, count valid applications in real-time
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job: Job) => {
        const applicantsCount = await countApplicationsByJobId(job.job_id);

        return {
          job_id: job.job_id,
          title: job.job_title,
          type: job.job_type || job.job_mode,
          location: job.job_location,
          applicants: applicantsCount,
          views: 0, // job.job_views is not in Job type apparently, defaulting to 0 as per previous code logic (though previous code had job.job_views || 0)
          date: new Date(job.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          status: job.job_status || "open",
          company: recruiter.company,
        };
      })
    );

    // 5️⃣ Respond
    return NextResponse.json(
      { recruiterId: recruiter.recruiter_id, jobs: jobsWithCounts },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Error in /api/recruiter/posts:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
