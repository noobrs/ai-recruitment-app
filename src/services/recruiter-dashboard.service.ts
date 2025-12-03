import { createClient } from "@/utils/supabase/server";
import { getJobsByRecruiterId } from "./job.service";
import { countApplicationsByJobId } from "./application.service";

export async function getRecruiterDashboard() {
  const supabase = await createClient();

  // ------------ 1. Get authenticated recruiter ------------
  const userRes = await supabase.auth.getUser();
  const sessionUser = userRes.data.user;

  if (!sessionUser) return null;

  const { data: recruiter } = await supabase
    .from("recruiter")
    .select("recruiter_id")
    .eq("user_id", sessionUser.id)
    .single();

  if (!recruiter) return null;

  const recruiterId = recruiter.recruiter_id;

  // ------------ 2. Get jobs belonging to the recruiter ------------
  const jobs = await getJobsByRecruiterId(recruiterId);
  const jobIds = jobs.map((j) => j.job_id);

  if (jobIds.length === 0) {
    return {
      activeJobs: 0,
      totalApplications: 0,
      applicationsThisWeek: 0,
      pendingReview: 0,
      withdrawnThisMonth: 0,
      recentApplications: [],
    };
  }

  // ------------ 3. Compute aggregated stats ------------
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeJobs = jobs.filter((j) => j.job_status === "open").length;

  // SINGLE query to get all applications for all jobs
  const { data: allApps } = await supabase
    .from("application")
    .select(`application_id, created_at, updated_at, status, job_id`)
    .in("job_id", jobIds);

  const totalApplications = allApps?.length || 0;

  const applicationsThisWeek =
    allApps?.filter((a) => new Date(a.created_at) >= oneWeekAgo).length || 0;

  const pendingReview =
    allApps?.filter(
      (a) => a.status === "received"
    ).length || 0;

  const withdrawnThisMonth =
    allApps?.filter(
      (a) =>
        a.status === "withdrawn" &&
        new Date(a.updated_at) >= firstDayOfMonth
    ).length || 0;

  // ------------ 4. Recent Applications (joined) ------------
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
      const seeker = Array.isArray(a.job_seeker)
        ? a.job_seeker[0]
        : a.job_seeker;

      return {
        id: a.application_id,
        alias: `Applicant #${String(seeker?.job_seeker_id || 0).padStart(
          4,
          "0"
        )}`,
        jobTitle: job?.job_title || "Untitled",
        date: new Date(a.created_at).toLocaleDateString("en-GB"),
        status: a.status,
      };
    }) || [];

  // ------------ 5. Response ------------
  return {
    activeJobs,
    totalApplications,
    applicationsThisWeek,
    pendingReview,
    withdrawnThisMonth,
    recentApplications,
  };
}
