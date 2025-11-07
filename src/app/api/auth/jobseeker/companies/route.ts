import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/auth/jobseeker/companies
 * Returns all companies with basic info and total job counts.
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

    // 2️⃣ Ensure jobseeker profile exists
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

    // 3️⃣ Fetch companies with recruiters and jobs to count active postings
    const { data: companies, error: companyError } = await supabase
      .from("company")
      .select(
        `
        company_id,
        comp_name,
        comp_logo_path,
        comp_industry,
        comp_website,
        created_at,
        recruiter (
          recruiter_id,
          job:job (
            job_id
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (companyError) {
      console.error("Company fetch error:", companyError.message);
      return NextResponse.json(
        { error: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    // 4️⃣ Transform data for UI consistency
    const refined = (companies || []).map((comp: any) => {
      const totalJobs = comp.recruiter?.reduce(
        (sum: number, rec: any) => sum + (rec.job?.length || 0),
        0
      );

      return {
        comp_id: comp.company_id,
        comp_name: comp.comp_name,
        comp_logo: comp.comp_logo_path
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${comp.comp_logo_path}`
          : "/default-company.png",
        comp_industry: comp.comp_industry || "Unknown Industry",
        comp_website: comp.comp_website || null,
        comp_location: "Unknown Location", // Not in DB
        comp_size: "N/A", // Not in DB
        comp_description: "No company description available.",
        comp_rating: null, // Not in DB
        total_jobs: totalJobs || 0,
        benefit_tag: totalJobs > 5 ? "High Benefit" : "Growing Team",
      };
    });

    return NextResponse.json({ companies: refined }, { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/auth/jobseeker/companies:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
