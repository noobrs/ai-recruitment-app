import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/jobseeker/companies
 * - Returns all companies with count of active (open) jobs
 * - OR a single company with its active jobs (if ?company_id provided)
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company_id");

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

    // 3️⃣ Fetch company list or single company details
    if (!companyId) {
      // ----- Fetch all companies -----
      const { data: companies, error: companyError } = await supabase
        .from("company")
        .select(
          `
          company_id,
          comp_name,
          comp_logo_path,
          comp_industry,
          comp_website,
          comp_location,
          comp_size,
          comp_rating,
          comp_description,
          created_at,
          recruiter (
            recruiter_id,
            job:job!inner (
              job_id,
              job_status
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (companyError) throw companyError;

      const refined = (companies || []).map((comp: any) => {
        // Filter only open jobs
        const openJobs = comp.recruiter?.reduce(
          (sum: number, rec: any) => {
            const openJobCount = rec.job?.filter((j: any) => j.job_status === "open").length || 0;
            return sum + openJobCount;
          },
          0
        ) || 0;

        return {
          comp_id: comp.company_id,
          comp_name: comp.comp_name,
          comp_logo: comp.comp_logo_path
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${comp.comp_logo_path}`
            : "/default-company.png",
          comp_industry: comp.comp_industry || "Unknown Industry",
          comp_website: comp.comp_website || null,
          comp_location: comp.comp_location || "Unknown Location",
          comp_size: comp.comp_size || "N/A",
          comp_description:
            comp.comp_description || "No company description available.",
          comp_rating: comp.comp_rating || 0,
          total_jobs: openJobs,
          benefit_tag: openJobs > 5 ? "High Benefit" : "Growing Team",
        };
      });

      return NextResponse.json({ companies: refined }, { status: 200 });
    } else {
      // ----- Fetch single company with jobs -----
      const { data: company, error: compErr } = await supabase
        .from("company")
        .select(
          `
          company_id,
          comp_name,
          comp_logo_path,
          comp_industry,
          comp_website,
          comp_location,
          comp_size,
          comp_description,
          comp_rating,

          recruiter (
            recruiter_id,
            position,

            users (
              id,
              first_name,
              last_name,
              profile_picture_path
            ),

            job:job (
              job_id,
              job_title,
              job_description,
              job_location,
              job_type,
              job_mode,
              job_industry,
              salary_range,
              job_status,
              created_at
            )
          )
          `
        )
        .eq("company_id", companyId)
        .single();

      if (compErr || !company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }

      // Filter only open jobs
      const jobs =
        company.recruiter?.flatMap((rec: any) =>
          (rec.job || []).filter((j: any) => j.job_status === "open")
        ) || [];

      // Map recruiters
      const recruiters =
        company.recruiter?.map((rec: any) => ({
          recruiter_id: rec.recruiter_id,
          position: rec.position || "Recruiter",
          name: `${rec.users?.first_name ?? ""} ${rec.users?.last_name ?? ""}`.trim(),
          avatar: rec.users?.profile_picture_path
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${rec.users.profile_picture_path}`
            : null,
        })) || [];

      return NextResponse.json(
        {
          company: {
            comp_id: company.company_id,
            comp_name: company.comp_name,
            comp_logo: company.comp_logo_path
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${company.comp_logo_path}`
              : "/default-company.png",
            comp_industry: company.comp_industry || "Unknown Industry",
            comp_website: company.comp_website || null,
            comp_location: company.comp_location || "Unknown Location",
            comp_size: company.comp_size || "N/A",
            comp_description:
              company.comp_description || "No company description provided.",
            comp_rating: company.comp_rating || 0,

            jobs,
            recruiters,
          },
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    console.error("Error in /api/jobseeker/companies:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
