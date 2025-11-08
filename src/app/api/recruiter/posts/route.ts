import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getJobsByRecruiterId } from "@/services/job.service";

/**
 * GET /api/recruiter/posts
 * Returns all job postings created by the authenticated recruiter.
 */
export async function GET() {
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

    // 2️⃣ Find recruiter profile and company info
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

    // 3️⃣ Fetch recruiter’s job posts
    const jobs = await getJobsByRecruiterId(recruiter.recruiter_id);

    // 4️⃣ Format data for front-end
    const formatted = jobs.map((job: any) => ({
      job_id: job.job_id,
      title: job.job_title,
      type: job.job_type || job.job_mode,
      location: job.job_location,
      applicants: 0, // can be updated later with real applicant count
      views: 0, // placeholder, since not tracked yet
      date: new Date(job.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: job.job_status || "Open",
      company: recruiter.company,
    }));

    return NextResponse.json(
      { recruiterId: recruiter.recruiter_id, jobs: formatted },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in /api/recruiter/posts:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
