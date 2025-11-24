"use server";

import { createClient } from "@/utils/supabase/server";
import { updateApplicationStatus, getApplicationById } from "@/services/application.service";
import { notifyApplicationStatusUpdated } from "@/utils/notification-helper";
import { ApplicationStatus } from "@/types";
import { createAdminClient } from "@/utils/supabase/admin";

interface UpdateStatusResult {
    success: boolean;
    error?: string;
    application?: {
        application_id: number;
        status: ApplicationStatus;
        [key: string]: unknown;
    };
    message?: string;
}

/**
 * Server action to update application status and notify the job seeker
 */
export async function updateApplicantStatus(
    applicationId: number,
    status: ApplicationStatus
): Promise<UpdateStatusResult> {
    try {
        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

        if (isNaN(applicationId)) {
            return { success: false, error: "Invalid application ID" };
        }

        // Get logged-in user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify user is a recruiter
        const { data: recruiter, error: recruiterError } = await supabase
            .from("recruiter")
            .select("recruiter_id")
            .eq("user_id", user.id)
            .single();

        if (recruiterError || !recruiter) {
            return { success: false, error: "Recruiter not found" };
        }

        // Validate status value
        const validStatuses: ApplicationStatus[] = [
            "received",
            "shortlisted",
            "rejected",
            "withdrawn",
            "unknown",
        ];

        if (!validStatuses.includes(status)) {
            return { success: false, error: "Invalid status value" };
        }

        // Get application details before update
        const application = await getApplicationById(applicationId);
        if (!application) {
            return { success: false, error: "Application not found" };
        }

        // Verify this application belongs to recruiter's job
        const { data: job, error: jobError } = await supabase
            .from("job")
            .select("job_id, job_title, recruiter_id, recruiter:recruiter_id(company:company_id(comp_name))")
            .eq("job_id", application.job_id)
            .single();

        if (jobError || !job || job.recruiter_id !== recruiter.recruiter_id) {
            return { success: false, error: "Unauthorized to update this application" };
        }

        // Update application status
        const updatedApplication = await updateApplicationStatus(
            applicationId,
            status
        );

        if (!updatedApplication) {
            return { success: false, error: "Failed to update application status" };
        }

        // Get job seeker user details to send notification
        const { data: jobSeekerData, error: jobSeekerError } = await supabase
            .from("job_seeker")
            .select("job_seeker_id, user:user_id(id, first_name, last_name)")
            .eq("job_seeker_id", application.job_seeker_id)
            .single();

        if (jobSeekerError || !jobSeekerData) {
            console.error("Failed to fetch job seeker details:", jobSeekerError);
            return {
                success: true,
                application: updatedApplication,
                message: "Status updated but notification failed"
            };
        }

        // Type assertion for user object
        const userData = jobSeekerData.user as unknown as { id: string; first_name: string | null; last_name: string | null };

        // Get job seeker email from auth.users table
        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(
            userData.id
        );

        if (authUserError || !authUser?.user?.email) {
            console.error("Failed to fetch job seeker email:", authUserError);
            return {
                success: true,
                application: updatedApplication,
                message: "Status updated but notification failed"
            };
        }

        // Send notification and email
        const companyName = (job.recruiter as unknown as { company?: { comp_name?: string } })?.company?.comp_name || "Unknown Company";
        const userName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "Job Seeker";

        try {
            await notifyApplicationStatusUpdated({
                userId: userData.id,
                userEmail: authUser.user.email,
                type: "application",
                applicationId: applicationId,
                userName: userName,
                jobTitle: job.job_title,
                companyName: companyName,
                newStatus: status,
                message: undefined,
            });
        } catch (notifyError) {
            console.error("Failed to send notification:", notifyError);
            // Don't fail the request if notification fails
        }

        return {
            success: true,
            application: updatedApplication,
            message: "Application status updated and notification sent"
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error in updateApplicantStatus:", errorMessage);
        return { success: false, error: "Internal server error" };
    }
}
