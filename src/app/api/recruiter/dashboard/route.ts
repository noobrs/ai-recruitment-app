import { NextResponse } from "next/server";
import { getRecruiterDashboard } from "@/services/recruiter-dashboard.service";

export async function GET() {
  try {
    const data = await getRecruiterDashboard();

    if (!data)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Dashboard route error:", error);
    return NextResponse.json(
      { error: "Server error", detail: error.message },
      { status: 500 }
    );
  }
}
