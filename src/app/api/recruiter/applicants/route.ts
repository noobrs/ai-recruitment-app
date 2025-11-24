import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getApplicantsByRecruiter } from "@/services/application.service";

/**
 * GET /api/recruiter/applicants
 * Fetches all applicants for the authenticated recruiter.
 * Supports query params: ?status=received,shortlisted
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recruiter_id
    const { data: recruiter, error: recruiterError } = await supabase
      .from("recruiter")
      .select("recruiter_id")
      .eq("user_id", user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: "Recruiter not found" },
        { status: 404 }
      );
    }

    // Parse filters from query
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const statuses = statusParam ? statusParam.split(",") : undefined;

    // Fetch data
    const applicants = await getApplicantsByRecruiter(
      recruiter.recruiter_id,
      statuses
    );

    return NextResponse.json({ applicants }, { status: 200 });
  } catch (err: unknown) {
    console.error("Error in /api/recruiter/applicants:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
