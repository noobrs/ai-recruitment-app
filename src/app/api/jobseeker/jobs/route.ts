import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Application } from "@/types";

/**
 * GET /api/jobseeker/jobs
 * Returns all active (open status) job listings with recruiter and company info.
 * Accessible only to authenticated jobseekers.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 1️⃣ Verify user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Get job seeker profile
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

    // 3️⃣ Fetch only open jobs with recruiter + company + requirements
    // Using deep joins — ensure FK recruiter.company_id → company.company_id exists
    const { data: jobs, error: jobError } = await supabase
      .from("job")
      .select(`
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
            comp_website
          )
        ),
        job_requirement (*),
        application!left (
          job_seeker_id,
          is_bookmark,
          status
        )
      `)
      .eq("job_status", "open")
      .order("created_at", { ascending: false });

    if (jobError) {
      console.error("Job fetch error:", jobError.message);
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // 4️⃣ Fallback check: flatten company if nested relation didn't resolve
    const formatted = (jobs || []).map((job) => {
      const isBookmarked =
        Array.isArray(job.application) &&
        job.application.some(
          (a: Pick<Application, 'job_seeker_id' | 'is_bookmark' | 'status'>) =>
            a.job_seeker_id === jobSeeker.job_seeker_id && a.is_bookmark === true
        );

      const isApplied =
        Array.isArray(job.application) &&
        job.application.some(
          (a: Pick<Application, 'job_seeker_id' | 'is_bookmark' | 'status'>) =>
            a.job_seeker_id === jobSeeker.job_seeker_id && a.status && a.status !== 'unknown' && a.status !== 'withdrawn'
        );

      const recruiterData = Array.isArray(job.recruiter) ? job.recruiter[0] : job.recruiter;
      const companyData = recruiterData?.company
        ? Array.isArray(recruiterData.company)
          ? recruiterData.company[0]
          : recruiterData.company
        : null;

      return {
        ...job,
        company: companyData,
        is_bookmark: !!isBookmarked,
        is_applied: !!isApplied,
      };
    });

    return NextResponse.json(
      { jobs: formatted, jobSeekerId: jobSeeker.job_seeker_id },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("Error in /api/jobseeker/jobs:", message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
