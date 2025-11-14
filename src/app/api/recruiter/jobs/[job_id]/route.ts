import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { job_id: string } }
) {
  try {
    const supabase = await createClient();
    const jobId = Number(params.job_id);

    // 1️⃣ Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Fetch recruiter profile (ensures only recruiters access)
    const { data: recruiter, error: recruiterError } = await supabase
      .from("recruiter")
      .select("recruiter_id")
      .eq("user_id", user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("job")
      .select(`
        *,
        recruiter (
          recruiter_id,
          position,
          company:company_id (
            comp_name,
            comp_industry,
            comp_logo_path,
            comp_website
          )
        ),
        job_requirement (*)
      `)
      .eq("job_id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 4️⃣ Flatten recruiter + company
    const recruiterInfo = Array.isArray(job.recruiter)
      ? job.recruiter[0]
      : job.recruiter;

    const company = recruiterInfo?.company || null;

    const formatted = {
      ...job,
      company: company
        ? {
            ...company,
            comp_logo: company.comp_logo_path
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${company.comp_logo_path}`
              : "/default-company.png",
          }
        : null,
    };

    return NextResponse.json({ job: formatted }, { status: 200 });
  } catch (err: any) {
    console.error("Recruiter job fetch error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
