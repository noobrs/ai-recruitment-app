import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

import { getJobsByRecruiterId } from "@/services/job.service";
import { countApplicationsByJobId } from "@/services/application.service";

interface DashboardResponse {
    activeJobs: number;
    totalApplications: number;
    applicationsThisWeek: number;
    scheduledInterviews: number;
    hiresThisMonth: number;
    recentApplications: {
        id: number;
        alias: string;
        jobTitle: string;
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
        // 2. Get recruiter ID
        // -------------------------------
        const { data: recruiter } = await supabase
            .from("recruiter")
            .select("recruiter_id")
            .eq("user_id", sessionUser.id)
            .single();

        if (!recruiter) {
            return NextResponse.json(
                { error: "Recruiter profile not found" },
                { status: 404 }
            );
        }

        const recruiterId = recruiter.recruiter_id;

        // -------------------------------
        // 3. Fetch recruiter's jobs
        // -------------------------------
        const jobs = await getJobsByRecruiterId(recruiterId);
        const jobIds = jobs.map((j) => j.job_id);

        if (jobIds.length === 0) {
            const empty: DashboardResponse = {
                activeJobs: 0,
                totalApplications: 0,
                applicationsThisWeek: 0,
                scheduledInterviews: 0,
                hiresThisMonth: 0,
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

        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const activeJobs = jobs.filter((j) => j.job_status === "open").length;

        let totalApplications = 0;
        let applicationsThisWeek = 0;
        let hiresThisMonth = 0;

        for (const jobId of jobIds) {
            totalApplications += await countApplicationsByJobId(jobId);

            const { data: apps } = await supabase
                .from("application")
                .select("status, created_at, updated_at")
                .eq("job_id", jobId);

            if (!apps) continue;

            applicationsThisWeek += apps.filter(
                (a) => new Date(a.created_at) >= oneWeekAgo
            ).length;

            hiresThisMonth += apps.filter(
                (a) =>
                    a.status === "hired" &&
                    new Date(a.updated_at) >= firstDayOfMonth
            ).length;
        }

        // -------------------------------
        // 5. Recent Applications
        // -------------------------------
        const { data: recentRaw } = await supabase
            .from("application")
            .select(
                `
        application_id,
        created_at,
        status,
        job:job_id(job_title),
        job_seeker:job_seeker_id(job_seeker_id)
      `
            )
            .in("job_id", jobIds)
            .order("created_at", { ascending: false })
            .limit(5);

        const recentApplications =
            recentRaw?.map((a: any) => {
                const job = Array.isArray(a.job) ? a.job[0] : a.job;
                const seeker = Array.isArray(a.job_seeker) ? a.job_seeker[0] : a.job_seeker;

                return {
                    id: a.application_id,
                    alias: `Applicant #${String(seeker?.job_seeker_id || 0).padStart(4, "0")}`,
                    jobTitle: job?.job_title || "Untitled",
                    date: new Date(a.created_at).toLocaleDateString("en-GB"),
                    status: a.status,
                };
            }) || [];


        // -------------------------------
        // 6. Final Response
        // -------------------------------
        const response: DashboardResponse = {
            activeJobs,
            totalApplications,
            applicationsThisWeek,
            scheduledInterviews: 0,
            hiresThisMonth,
            recentApplications,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("Dashboard route error:", error);
        return NextResponse.json(
            { error: "Server error", detail: error.message },
            { status: 500 }
        );
    }
}
