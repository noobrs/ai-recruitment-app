import { sendEmail } from '@/services/email.service';
import { createNotification } from '@/services/notification.service';
import { NotificationType } from '@/types';
import {
    jobApplicationSubmittedTemplate,
    applicationStatusUpdatedTemplate,
    newApplicationReceivedTemplate,
    applicationWithdrawnTemplate,
    genericNotificationTemplate,
    type ResumeUploadedData,
    type JobApplicationData,
    type ApplicationStatusUpdateData,
    type NewApplicationData,
    type ApplicationWithdrawnData,
} from '@/utils/email-templates';

/**
 * Base notification data
 */
interface BaseNotificationData {
    userId: string;
    userEmail: string;
    type: NotificationType;
    applicationId?: number;
}

/**
 * Send email and create notification for job application submission
 */
export async function notifyJobApplicationSubmitted(
    data: BaseNotificationData & JobApplicationData & { applicationId: number }
): Promise<{ emailSent: boolean; notificationCreated: boolean }> {
    const { userId, userEmail, type, applicationId, ...templateData } = data;

    // Generate email template
    const emailTemplate = jobApplicationSubmittedTemplate(templateData);

    // Send email
    const emailResult = await sendEmail({
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
    });

    // Create notification message
    const notificationMessage = `Your application for ${templateData.jobTitle} at ${templateData.companyName} has been successfully submitted.`;

    // Create in-app notification
    const notification = await createNotification({
        user_id: userId,
        type: type || 'application',
        message: notificationMessage,
        application_id: applicationId,
    });

    return {
        emailSent: emailResult.success,
        notificationCreated: !!notification,
    };
}

/**
 * Send email and create notification for application status update
 */
export async function notifyApplicationStatusUpdated(
    data: BaseNotificationData & ApplicationStatusUpdateData & { applicationId: number }
): Promise<{ emailSent: boolean; notificationCreated: boolean }> {
    const { userId, userEmail, type, applicationId, ...templateData } = data;

    // Generate email template
    const emailTemplate = applicationStatusUpdatedTemplate(templateData);

    // Send email
    const emailResult = await sendEmail({
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
    });

    // Create notification message
    const notificationMessage = `Your application for ${templateData.jobTitle} at ${templateData.companyName} has been updated to: ${templateData.newStatus}`;

    // Create in-app notification
    const notification = await createNotification({
        user_id: userId,
        type: type || 'application',
        message: notificationMessage,
        application_id: applicationId,
    });

    return {
        emailSent: emailResult.success,
        notificationCreated: !!notification,
    };
}

/**
 * Send email and create notification for new application (recruiter)
 */
export async function notifyNewApplicationReceived(
    data: BaseNotificationData & NewApplicationData & { applicationId: number }
): Promise<{ emailSent: boolean; notificationCreated: boolean }> {
    const { userId, userEmail, type, applicationId, ...templateData } = data;

    // Generate email template
    const emailTemplate = newApplicationReceivedTemplate(templateData);

    // Send email
    const emailResult = await sendEmail({
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
    });

    // Create notification message
    const notificationMessage = `New application received for ${templateData.jobTitle} from ${templateData.applicantName}`;

    // Create in-app notification
    const notification = await createNotification({
        user_id: userId,
        type: type || 'application',
        message: notificationMessage,
        application_id: applicationId,
    });

    return {
        emailSent: emailResult.success,
        notificationCreated: !!notification,
    };
}

/**
 * Send email and create notification for application withdrawal (recruiter)
 */
export async function notifyApplicationWithdrawn(
    data: BaseNotificationData & ApplicationWithdrawnData & { applicationId: number }
): Promise<{ emailSent: boolean; notificationCreated: boolean }> {
    const { userId, userEmail, type, applicationId, ...templateData } = data;

    // Generate email template
    const emailTemplate = applicationWithdrawnTemplate(templateData);

    // Send email
    const emailResult = await sendEmail({
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
    });

    // Create notification message
    const notificationMessage = `Application withdrawn for ${templateData.jobTitle} by ${templateData.applicantName}`;

    // Create in-app notification
    const notification = await createNotification({
        user_id: userId,
        type: type || 'application',
        message: notificationMessage,
        application_id: applicationId,
    });

    return {
        emailSent: emailResult.success,
        notificationCreated: !!notification,
    };
}

/**
 * Send generic email and notification
 */
export async function notifyGeneric(
    data: BaseNotificationData & {
        userName: string;
        title: string;
        message: string;
        actionUrl?: string;
        actionText?: string;
    }
): Promise<{ emailSent: boolean; notificationCreated: boolean }> {
    const { userId, userEmail, type, applicationId, userName, title, message, actionUrl, actionText } = data;

    // Generate email template
    const emailTemplate = genericNotificationTemplate({
        userName,
        title,
        message,
        actionUrl,
        actionText,
    });

    // Send email
    const emailResult = await sendEmail({
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
    });

    // Create in-app notification
    const notification = await createNotification({
        user_id: userId,
        type: type || 'general',
        message: message,
        application_id: applicationId,
    });

    return {
        emailSent: emailResult.success,
        notificationCreated: !!notification,
    };
}
