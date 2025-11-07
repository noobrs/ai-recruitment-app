/**
 * Email template data interfaces
 */
export interface ResumeUploadedData {
    userName: string;
    fileName: string;
    extractedSkills?: string[];
    extractedExperiences?: string[];
    extractedEducation?: string[];
    feedback?: string;
}

export interface JobApplicationData {
    userName: string;
    jobTitle: string;
    companyName: string;
    applicationDate: string;
}

export interface ApplicationStatusUpdateData {
    userName: string;
    jobTitle: string;
    companyName: string;
    newStatus: string;
    message?: string;
}

export interface NewApplicationData {
    recruiterName: string;
    jobTitle: string;
    applicantName: string;
    applicationDate: string;
}

export interface ApplicationWithdrawnData {
    recruiterName: string;
    jobTitle: string;
    applicantName: string;
    withdrawnDate: string;
}

/**
 * Base email template wrapper
 */
function emailWrapper(content: string, preheader?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Recruitment Platform</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 40px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success-badge {
      display: inline-block;
      background-color: #28a745;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin: 10px 0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>🚀 AI Recruitment Platform</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} AI Recruitment Platform. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Template: Resume Uploaded and Parsed
 */
export function resumeUploadedTemplate(data: ResumeUploadedData): { subject: string; html: string } {
    const content = `
    <h2>Resume Processing Complete! 📄</h2>
    <p>Hi <strong>${data.userName}</strong>,</p>
    <p>Your resume has been successfully uploaded and analyzed. Here's what we found:</p>
    
    <div class="info-box">
      <p><strong>File:</strong> ${data.fileName}</p>
      <span class="success-badge">✓ Successfully Processed</span>
    </div>

    ${data.extractedSkills && data.extractedSkills.length > 0 ? `
    <h3>🎯 Extracted Skills:</h3>
    <ul>
      ${data.extractedSkills.map(skill => `<li>${skill}</li>`).join('')}
    </ul>
    ` : ''}

    ${data.extractedExperiences && data.extractedExperiences.length > 0 ? `
    <h3>💼 Work Experience:</h3>
    <ul>
      ${data.extractedExperiences.map(exp => `<li>${exp}</li>`).join('')}
    </ul>
    ` : ''}

    ${data.extractedEducation && data.extractedEducation.length > 0 ? `
    <h3>🎓 Education:</h3>
    <ul>
      ${data.extractedEducation.map(edu => `<li>${edu}</li>`).join('')}
    </ul>
    ` : ''}

    ${data.feedback ? `
    <div class="info-box">
      <h3>💡 AI Feedback:</h3>
      <p>${data.feedback}</p>
    </div>
    ` : ''}

    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/jobseeker/profile" class="button">View Your Profile</a>

    <p>Your resume is now ready to be used for job applications!</p>
  `;

    return {
        subject: '✅ Your Resume Has Been Processed Successfully',
        html: emailWrapper(content, 'Your resume processing is complete'),
    };
}

/**
 * Template: Job Application Submitted
 */
export function jobApplicationSubmittedTemplate(data: JobApplicationData): { subject: string; html: string } {
    const content = `
    <h2>Application Submitted Successfully! 🎉</h2>
    <p>Hi <strong>${data.userName}</strong>,</p>
    <p>Your application has been successfully submitted!</p>
    
    <div class="info-box">
      <p><strong>Position:</strong> ${data.jobTitle}</p>
      <p><strong>Company:</strong> ${data.companyName}</p>
      <p><strong>Applied on:</strong> ${data.applicationDate}</p>
      <span class="success-badge">✓ Application Submitted</span>
    </div>

    <p>The recruiter will review your application and get back to you soon. You'll receive a notification when there's an update on your application status.</p>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/jobseeker/jobs" class="button">View All Applications</a>

    <p>Good luck with your application! 🍀</p>
  `;

    return {
        subject: `✅ Application Submitted: ${data.jobTitle} at ${data.companyName}`,
        html: emailWrapper(content, `Your application for ${data.jobTitle} has been submitted`),
    };
}

/**
 * Template: Application Status Updated
 */
export function applicationStatusUpdatedTemplate(data: ApplicationStatusUpdateData): { subject: string; html: string } {
    const statusEmoji: { [key: string]: string } = {
        received: '📨',
        shortlisted: '⭐',
        rejected: '❌',
        withdrawn: '🔙',
    };

    const statusColor: { [key: string]: string } = {
        received: '#007bff',
        shortlisted: '#28a745',
        rejected: '#dc3545',
        withdrawn: '#6c757d',
    };

    const emoji = statusEmoji[data.newStatus.toLowerCase()] || '📢';
    const color = statusColor[data.newStatus.toLowerCase()] || '#667eea';

    const content = `
    <h2>Application Status Update ${emoji}</h2>
    <p>Hi <strong>${data.userName}</strong>,</p>
    <p>There's an update on your job application:</p>
    
    <div class="info-box">
      <p><strong>Position:</strong> ${data.jobTitle}</p>
      <p><strong>Company:</strong> ${data.companyName}</p>
      <p><strong>New Status:</strong></p>
      <span class="success-badge" style="background-color: ${color};">${emoji} ${data.newStatus.toUpperCase()}</span>
    </div>

    ${data.message ? `
    <div class="info-box">
      <h3>📝 Message from Recruiter:</h3>
      <p>${data.message}</p>
    </div>
    ` : ''}

    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/jobseeker/jobs" class="button">View Application Details</a>

    ${data.newStatus.toLowerCase() === 'shortlisted' ? '<p><strong>Congratulations!</strong> You\'ve been shortlisted. The recruiter may contact you soon for the next steps.</p>' : ''}
  `;

    return {
        subject: `${emoji} Application Update: ${data.jobTitle} - ${data.newStatus}`,
        html: emailWrapper(content, `Your application status has been updated to ${data.newStatus}`),
    };
}

/**
 * Template: New Application Received (for Recruiters)
 */
export function newApplicationReceivedTemplate(data: NewApplicationData): { subject: string; html: string } {
    const content = `
    <h2>New Application Received! 📬</h2>
    <p>Hi <strong>${data.recruiterName}</strong>,</p>
    <p>Great news! You have a new application for one of your job postings.</p>
    
    <div class="info-box">
      <p><strong>Position:</strong> ${data.jobTitle}</p>
      <p><strong>Applicant:</strong> ${data.applicantName}</p>
      <p><strong>Applied on:</strong> ${data.applicationDate}</p>
      <span class="success-badge">📨 New Application</span>
    </div>

    <p>Review the candidate's profile and resume to see if they're a good fit for the position.</p>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/recruiter/dashboard" class="button">Review Application</a>

    <p>Don't keep great candidates waiting! 🚀</p>
  `;

    return {
        subject: `📬 New Application: ${data.jobTitle} - ${data.applicantName}`,
        html: emailWrapper(content, `New application received for ${data.jobTitle}`),
    };
}

/**
 * Template: Application Withdrawn (for Recruiters)
 */
export function applicationWithdrawnTemplate(data: ApplicationWithdrawnData): { subject: string; html: string } {
    const content = `
    <h2>Application Withdrawn 🔙</h2>
    <p>Hi <strong>${data.recruiterName}</strong>,</p>
    <p>This is to inform you that an applicant has withdrawn their application.</p>
    
    <div class="info-box">
      <p><strong>Position:</strong> ${data.jobTitle}</p>
      <p><strong>Applicant:</strong> ${data.applicantName}</p>
      <p><strong>Withdrawn on:</strong> ${data.withdrawnDate}</p>
      <span class="success-badge" style="background-color: #6c757d;">🔙 Withdrawn</span>
    </div>

    <p>The application status has been updated in your dashboard.</p>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/recruiter/dashboard" class="button">View Dashboard</a>
  `;

    return {
        subject: `🔙 Application Withdrawn: ${data.jobTitle} - ${data.applicantName}`,
        html: emailWrapper(content, `Application withdrawn for ${data.jobTitle}`),
    };
}

/**
 * Template: Generic Notification
 */
export function genericNotificationTemplate(data: { userName: string; title: string; message: string; actionUrl?: string; actionText?: string }): { subject: string; html: string } {
    const content = `
    <h2>${data.title}</h2>
    <p>Hi <strong>${data.userName}</strong>,</p>
    <p>${data.message}</p>
    
    ${data.actionUrl && data.actionText ? `
    <a href="${data.actionUrl}" class="button">${data.actionText}</a>
    ` : ''}
  `;

    return {
        subject: data.title,
        html: emailWrapper(content, data.message),
    };
}
