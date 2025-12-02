import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRecruiterByUserId } from "@/services/recruiter.service";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch recruiter profile
    const recruiter = await getRecruiterByUserId(user.id);
    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });
    }

    // Parse filters from query
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const statuses = statusParam ? statusParam.split(",") : undefined;

    // Fetch ONLY jobs posted by this recruiter
    let query = supabase
      .from("job")
      .select(`
        job_id,
        job_title,
        job_location,
        job_type,
        job_mode,
        job_status,
        created_at,
        recruiter:recruiter_id (
          recruiter_id,
          company:company_id (
            comp_name,
            comp_logo_path,
            comp_location
          )
        )
      `)
      .eq("recruiter_id", recruiter.recruiter_id);

    if (statuses && statuses.length > 0) {
      query = query.in("job_status", statuses);
    }

    const { data: jobs, error: jobError } = await query.order("created_at", { ascending: false });

    if (jobError) {
      console.error("Supabase Error:", jobError);
      return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
    }

    // Format results safely
    const formatted = (jobs || []).map((job: any) => {
      const recruiterObj = Array.isArray(job.recruiter)
        ? job.recruiter[0]
        : job.recruiter;

      const companyObj = recruiterObj?.company
        ? Array.isArray(recruiterObj.company)
          ? recruiterObj.company[0]
          : recruiterObj.company
        : null;

      return {
        job_id: job.job_id,
        title: job.job_title,
        location: job.job_location,
        type: job.job_type || job.job_mode,
        date: new Date(job.created_at).toLocaleDateString(),
        created_at: job.created_at,
        status: job.job_status,
        recruiter_id: recruiterObj?.recruiter_id || null,
        company: {
          name: companyObj?.comp_name || "Unknown",
          logo: companyObj?.comp_logo_path || "/default-company.png",
          location: companyObj?.comp_location || "Unknown",
        },
      };
    });

    return NextResponse.json({
      recruiterId: recruiter.recruiter_id,
      jobs: formatted
    });

  } catch (err: any) {
    console.error("Unexpected Server Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
