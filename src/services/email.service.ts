import nodemailer from 'nodemailer';

/**
 * Email configuration interface
 */
export interface EmailConfig {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

/**
 * Create a reusable transporter for sending emails via Gmail
 */
function createTransporter() {
    const gmailUsername = process.env.GMAIL_USERNAME;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUsername || !gmailAppPassword) {
        throw new Error('Gmail credentials are not configured. Please set GMAIL_USERNAME and GMAIL_APP_PASSWORD in .env.local');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUsername,
            pass: gmailAppPassword,
        },
    });
}

/**
 * Send an email using Gmail
 * @param config - Email configuration object
 * @returns Promise with the result of sending the email
 */
export async function sendEmail(config: EmailConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `AI Recruitment Platform <${process.env.GMAIL_USERNAME}>`,
            to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
            subject: config.subject,
            html: config.html,
            text: config.text || config.html.replace(/<[^>]*>/g, ''), // Fallback to stripped HTML if no text provided
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Verify email configuration
 * @returns Promise with verification result
 */
export async function verifyEmailConfig(): Promise<{ success: boolean; error?: string }> {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        return { success: true };
    } catch (error) {
        console.error('Email configuration verification failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}
