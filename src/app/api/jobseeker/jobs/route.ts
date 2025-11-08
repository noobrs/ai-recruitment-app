import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/jobseeker/jobs
 * Returns all job listings with recruiter and company info.
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

    // 3️⃣ Fetch jobs with recruiter + company + requirements
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
          is_bookmark
        )
      `)
      .order("created_at", { ascending: false });

    if (jobError) {
      console.error("Job fetch error:", jobError.message);
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // 4️⃣ Fallback check: flatten company if nested relation didn't resolve
    const formatted = (jobs || []).map((job: any) => {
      const isBookmarked =
        Array.isArray(job.application) &&
        job.application.some(
          (a: any) =>
            a.job_seeker_id === jobSeeker.job_seeker_id && a.is_bookmark === true
        );

      return {
        ...job,
        company: job.recruiter?.company || null,
        is_bookmark: !!isBookmarked,
      };
    });

    return NextResponse.json(
      { jobs: formatted, jobSeekerId: jobSeeker.job_seeker_id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in /api/jobseeker/jobs:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
