import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Application } from "@/types";

/**
 * GET /api/jobseeker/jobs/[job_id]
 * Returns full job detail with recruiter, company, and requirement info.
 */
export async function GET(
  req: Request,
  { params }: { params: { job_id: string } }
) {
  try {
    const supabase = await createClient();
    const jobId = Number(params.job_id);

    // 1️⃣ Verify user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Get jobseeker profile
    const { data: jobSeeker, error: seekerError } = await supabase
      .from("job_seeker")
      .select("job_seeker_id")
      .eq("user_id", user.id)
      .single();

    if (seekerError || !jobSeeker) {
      return NextResponse.json(
        { error: "Jobseeker profile not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Fetch job details with recruiter + company + requirements
    const { data: job, error: jobError } = await supabase
      .from("job")
      .select(
        `
        job_id,
        job_title,
        job_description,
        job_location,
        job_benefits,
        job_type,
        job_mode,
        job_industry,
        salary_range,
        job_status,
        created_at,
        recruiter (
          recruiter_id,
          position,
          company:company_id (
            company_id,
            comp_name,
            comp_industry,
            comp_website,
            comp_logo_path
          )
        ),
        job_requirement (*),
        application!left (
          job_seeker_id,
          is_bookmark,
          status
        )
      `
      )
      .eq("job_id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Job fetch error:", jobError?.message);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 4️⃣ Safely extract the first recruiter and company
    const recruiter = Array.isArray(job.recruiter)
      ? job.recruiter[0]
      : job.recruiter;

    const company = recruiter?.company
      ? Array.isArray(recruiter.company)
        ? recruiter.company[0]
        : recruiter.company
      : null;

    // 5️⃣ Determine if bookmarked by this jobseeker
    const isBookmarked =
      Array.isArray(job.application) &&
      job.application.some(
        (a: Pick<Application, 'job_seeker_id' | 'is_bookmark' | 'status'>) =>
          a.job_seeker_id === jobSeeker.job_seeker_id && a.is_bookmark === true
      );

    // Check if jobseeker has applied to this job
    const isApplied =
      Array.isArray(job.application) &&
      job.application.some(
        (a: Pick<Application, 'job_seeker_id' | 'is_bookmark' | 'status'>) =>
          a.job_seeker_id === jobSeeker.job_seeker_id && a.status && a.status !== 'unknown'
      );

    // 6️⃣ Format company logo + flatten job structure
    const formattedJob = {
      ...job,
      company: company
        ? {
          ...company,
          comp_logo: company.comp_logo_path
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${company.comp_logo_path}`
            : "/default-company.png",
        }
        : null,
      is_bookmark: !!isBookmarked,
      is_applied: !!isApplied,
    };

    return NextResponse.json(
      { job: formattedJob, jobSeekerId: jobSeeker.job_seeker_id },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("Error in /api/jobseeker/jobs/[job_id]:", message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
