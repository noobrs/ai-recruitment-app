import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/services/email.service';
import {
    resumeUploadedTemplate,
    jobApplicationSubmittedTemplate,
    applicationStatusUpdatedTemplate,
    newApplicationReceivedTemplate,
    applicationWithdrawnTemplate,
    genericNotificationTemplate,
} from '@/utils/email-templates';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            scenario,
            recipientEmail,
            recipientName,
            fileName,
            skills,
            experiences,
            education,
            feedback,
            jobTitle,
            companyName,
            newStatus,
            statusMessage,
            emailTitle,
            emailMessage,
        } = body;

        if (!recipientEmail || !recipientName) {
            return NextResponse.json(
                { error: 'Recipient email and name are required' },
                { status: 400 }
            );
        }

        let emailTemplate: { subject: string; html: string };

        // Generate email based on scenario
        switch (scenario) {
            case 'resume-uploaded':
                emailTemplate = resumeUploadedTemplate({
                    userName: recipientName,
                    fileName: fileName || 'resume.pdf',
                    extractedSkills: skills ? skills.split(',').map((s: string) => s.trim()) : [],
                    extractedExperiences: experiences ? experiences.split(',').map((s: string) => s.trim()) : [],
                    extractedEducation: education ? education.split(',').map((s: string) => s.trim()) : [],
                    feedback: feedback || undefined,
                });
                break;

            case 'job-applied':
                emailTemplate = jobApplicationSubmittedTemplate({
                    userName: recipientName,
                    jobTitle: jobTitle || 'Software Engineer',
                    companyName: companyName || 'Tech Company',
                    applicationDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                });
                break;

            case 'status-updated':
                emailTemplate = applicationStatusUpdatedTemplate({
                    userName: recipientName,
                    jobTitle: jobTitle || 'Software Engineer',
                    companyName: companyName || 'Tech Company',
                    newStatus: newStatus || 'received',
                    message: statusMessage || undefined,
                });
                break;

            case 'new-application':
                emailTemplate = newApplicationReceivedTemplate({
                    recruiterName: recipientName,
                    jobTitle: jobTitle || 'Software Engineer',
                    applicantName: 'John Doe',
                    applicationDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                });
                break;

            case 'application-withdrawn':
                emailTemplate = applicationWithdrawnTemplate({
                    recruiterName: recipientName,
                    jobTitle: jobTitle || 'Software Engineer',
                    applicantName: 'John Doe',
                    withdrawnDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                });
                break;

            case 'generic':
                emailTemplate = genericNotificationTemplate({
                    userName: recipientName,
                    title: emailTitle || 'Notification',
                    message: emailMessage || 'This is a test notification',
                    actionUrl: process.env.NEXT_PUBLIC_SITE_URL,
                    actionText: 'View Dashboard',
                });
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid scenario' },
                    { status: 400 }
                );
        }

        // Send email
        const result = await sendEmail({
            to: recipientEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            messageId: result.messageId,
            notificationCreated: false, // In test mode, we don't create actual notifications
        });
    } catch (error) {
        console.error('Error in test-email API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
