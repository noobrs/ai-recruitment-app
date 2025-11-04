import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/auth/jobseeker/jobs
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

    if (authError) {
      console.error("Auth error:", authError.message);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Check if user is a jobseeker
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    if (profile?.role !== "jobseeker") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3️⃣ Fetch jobs with recruiter + company + requirements
    // Using deep joins — ensure FK recruiter.company_id → company.company_id exists
    const { data, error } = await supabase
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
        job_requirement (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Job fetch error:", error.message);
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
    }

    // 4️⃣ Fallback check: flatten company if nested relation didn't resolve
    const formatted = (data || []).map((job: any) => ({
      job_id: job.job_id,
      job_title: job.job_title,
      job_location: job.job_location,
      job_type: job.job_type,
      created_at: job.created_at,
      job_benefits: job.job_benefits,
      job_description: job.job_description,
      job_mode: job.job_mode,
      job_industry: job.job_industry,
      salary_range: job.salary_range,
      job_status: job.job_status,
      company:
        job.recruiter?.company || null, // ✅ nested company
      recruiter: job.recruiter ? {
        recruiter_id: job.recruiter.recruiter_id,
        position: job.recruiter.position,
      } : null,
      job_requirement: job.job_requirement || [],
    }));

    // 5️⃣ Return jobs list
    return NextResponse.json(formatted, { status: 200 });
  } catch (err: any) {
    console.error("Server error in /api/auth/jobseeker/jobs:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
