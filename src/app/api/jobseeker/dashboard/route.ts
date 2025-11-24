import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface ApplicationWithRelations {
    application_id: number;
    created_at: string;
    updated_at: string;
    is_bookmark: boolean;
    status: string;
    job: {
        job_title: string;
        recruiter: {
            company: {
                comp_name: string;
            };
        };
    } | null;
}

export interface DashboardResponse {
    totalApplications: number;
    applicationsThisWeek: number;
    pendingApplications: number;
    rejectedApplications: number;
    savedJobs: number;
    recentApplications: {
        id: number;
        jobTitle: string;
        companyName: string;
        date: string;
        status: string;
    }[];
}

export async function GET() {
    try {
        const supabase = await createClient();

        // -------------------------------
        // 1. Validate session
        // -------------------------------
        const userRes = await supabase.auth.getUser();
        const sessionUser = userRes.data.user;

        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // -------------------------------
        // 2. Get job seeker ID
        // -------------------------------
        const { data: jobSeeker } = await supabase
            .from("job_seeker")
            .select("job_seeker_id")
            .eq("user_id", sessionUser.id)
            .single();

        if (!jobSeeker) {
            return NextResponse.json(
                { error: "Job seeker profile not found" },
                { status: 404 }
            );
        }

        const jobSeekerId = jobSeeker.job_seeker_id;

        // -------------------------------
        // 3. Fetch applications
        // -------------------------------
        const { data: applications } = await supabase
            .from("application")
            .select(
                `
        application_id,
        created_at,
        updated_at,
        is_bookmark,
        status,
        job:job_id(
          job_title,
          recruiter:recruiter_id(
            company:company_id(comp_name)
          )
        )
      `
            )
            .eq("job_seeker_id", jobSeekerId)
            .order("created_at", { ascending: false }) as { data: ApplicationWithRelations[] | null };

        if (!applications) {
            const empty: DashboardResponse = {
                totalApplications: 0,
                applicationsThisWeek: 0,
                pendingApplications: 0,
                rejectedApplications: 0,
                savedJobs: 0,
                recentApplications: [],
            };
            return NextResponse.json(empty, { status: 200 });
        }

        // -------------------------------
        // 4. Compute statistics
        // -------------------------------
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);

        const totalApplications = applications.length;

        const applicationsThisWeek = applications.filter(
            (a) => new Date(a.created_at) >= oneWeekAgo
        ).length;

        const pendingApplications = applications.filter(
            (a) => a.status === "received"
        ).length;


        const rejectedApplications = applications.filter(
            (a) => a.status === "rejected"
        ).length;

        // -------------------------------
        // 5. Get saved jobs count
        // -------------------------------
        const savedJobs = applications.filter(
            (a) => a.is_bookmark === true
        ).length;

        // -------------------------------
        // 6. Recent Applications (limit to 5)
        // -------------------------------
        const recentApplications = applications.slice(0, 5).map((a) => {
            const job = Array.isArray(a.job) ? a.job[0] : a.job;
            const recruiter = job?.recruiter
                ? Array.isArray(job.recruiter)
                    ? job.recruiter[0]
                    : job.recruiter
                : null;
            const company = recruiter?.company
                ? Array.isArray(recruiter.company)
                    ? recruiter.company[0]
                    : recruiter.company
                : null;

            return {
                id: a.application_id,
                jobTitle: job?.job_title || "Untitled",
                companyName: company?.comp_name || "Unknown Company",
                date: new Date(a.created_at).toLocaleDateString("en-GB"),
                status: a.status,
            };
        });

        // -------------------------------
        // 7. Final Response
        // -------------------------------
        const response: DashboardResponse = {
            totalApplications,
            applicationsThisWeek,
            pendingApplications,
            rejectedApplications,
            savedJobs,
            recentApplications,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Dashboard route error:", error);
        return NextResponse.json(
            { error: "Server error", detail: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
