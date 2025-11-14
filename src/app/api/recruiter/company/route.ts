import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateCompany } from "@/services/company.service";

/**
 * GET /api/recruiter/company
 * Returns the recruiter's company info
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Recruiter lookup
    const { data: recruiter, error: recruiterError } = await supabase
      .from("recruiter")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    // Company fetch
    const { data: company, error: companyError } = await supabase
      .from("company")
      .select("*")
      .eq("company_id", recruiter.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ company }, { status: 200 });
  } catch (err: any) {
    console.error("Company fetch error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/company
 * Updates the company info (name, industry, website)
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { comp_name, comp_industry, comp_website } = body;

    // Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Recruiter lookup
    const { data: recruiter } = await supabase
      .from("recruiter")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    // Update company
    const updated = await updateCompany(recruiter.company_id, {
      comp_name,
      comp_industry,
      comp_website,
    });

    if (!updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ company: updated }, { status: 200 });
  } catch (err: any) {
    console.error("Company update error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
