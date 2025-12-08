import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getApplicantsByJobIdForRecruiter } from "@/services/application.service";
import { getJobDetailsForRecruiter } from "@/services/job.service";

export async function GET(request: Request, { params }: { params: { job_id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jobId = await String(params.job_id);
    const { searchParams } = new URL(request.url);
    const sortOrder = searchParams.get("sort") === "asc" ? "asc" : "desc";

    const jobDetails = await getJobDetailsForRecruiter(jobId);
    const applicants = await getApplicantsByJobIdForRecruiter(jobId, sortOrder);

    return NextResponse.json(
      { job: jobDetails, applicants },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching job applicants:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
