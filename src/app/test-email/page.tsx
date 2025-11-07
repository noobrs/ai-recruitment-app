'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

type EmailScenario =
    | 'resume-uploaded'
    | 'job-applied'
    | 'status-updated'
    | 'new-application'
    | 'application-withdrawn'
    | 'generic';

interface FormData {
    scenario: EmailScenario;
    recipientEmail: string;
    recipientName: string;
    // Resume uploaded fields
    fileName?: string;
    skills?: string;
    experiences?: string;
    education?: string;
    feedback?: string;
    // Job application fields
    jobTitle?: string;
    companyName?: string;
    // Status update fields
    newStatus?: string;
    statusMessage?: string;
    // Generic fields
    emailTitle?: string;
    emailMessage?: string;
}

export default function TestEmailPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        scenario: 'resume-uploaded',
        recipientEmail: '',
        recipientName: '',
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.recipientEmail || !formData.recipientName) {
            toast.error('Please fill in recipient email and name');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(
                    `Email sent successfully! ${result.notificationCreated ? 'Notification created.' : ''}`
                );
            } else {
                toast.error(result.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            toast.error('An error occurred while sending the email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            📧 Email & Notification Test Center
                        </h1>
                        <p className="text-gray-600">
                            Test the email sending and notification system with different scenarios
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Scenario Selection */}
                        <div>
                            <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Scenario
                            </label>
                            <select
                                id="scenario"
                                name="scenario"
                                value={formData.scenario}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="resume-uploaded">📄 Resume Upload Complete (Jobseeker)</option>
                                <option value="job-applied">🎯 Job Application Submitted (Jobseeker)</option>
                                <option value="status-updated">📊 Application Status Updated (Jobseeker)</option>
                                <option value="new-application">📬 New Application Received (Recruiter)</option>
                                <option value="application-withdrawn">🔙 Application Withdrawn (Recruiter)</option>
                                <option value="generic">📢 Generic Notification</option>
                            </select>
                        </div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                    Recipient Email *
                                </label>
                                <input
                                    type="email"
                                    id="recipientEmail"
                                    name="recipientEmail"
                                    value={formData.recipientEmail}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Recipient Name *
                                </label>
                                <input
                                    type="text"
                                    id="recipientName"
                                    name="recipientName"
                                    value={formData.recipientName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Scenario-specific fields */}
                        {formData.scenario === 'resume-uploaded' && (
                            <div className="space-y-4 p-6 bg-purple-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Resume Upload Details</h3>

                                <div>
                                    <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
                                        File Name
                                    </label>
                                    <input
                                        type="text"
                                        id="fileName"
                                        name="fileName"
                                        value={formData.fileName || ''}
                                        onChange={handleInputChange}
                                        placeholder="resume.pdf"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                                        Extracted Skills (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        id="skills"
                                        name="skills"
                                        value={formData.skills || ''}
                                        onChange={handleInputChange}
                                        placeholder="JavaScript, React, Node.js"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="experiences" className="block text-sm font-medium text-gray-700 mb-2">
                                        Work Experiences (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        id="experiences"
                                        name="experiences"
                                        value={formData.experiences || ''}
                                        onChange={handleInputChange}
                                        placeholder="Senior Developer at Tech Corp, Junior Developer at StartUp Inc"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
                                        Education (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        id="education"
                                        name="education"
                                        value={formData.education || ''}
                                        onChange={handleInputChange}
                                        placeholder="BS Computer Science, MIT"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                                        AI Feedback
                                    </label>
                                    <textarea
                                        id="feedback"
                                        name="feedback"
                                        value={formData.feedback || ''}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Your resume shows strong technical skills..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {(formData.scenario === 'job-applied' ||
                            formData.scenario === 'status-updated' ||
                            formData.scenario === 'new-application' ||
                            formData.scenario === 'application-withdrawn') && (
                                <div className="space-y-4 p-6 bg-blue-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-900 mb-3">Job & Application Details</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                                                Job Title
                                            </label>
                                            <input
                                                type="text"
                                                id="jobTitle"
                                                name="jobTitle"
                                                value={formData.jobTitle || ''}
                                                onChange={handleInputChange}
                                                placeholder="Senior Frontend Developer"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                id="companyName"
                                                name="companyName"
                                                value={formData.companyName || ''}
                                                onChange={handleInputChange}
                                                placeholder="Tech Corp"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {formData.scenario === 'status-updated' && (
                                        <>
                                            <div>
                                                <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Status
                                                </label>
                                                <select
                                                    id="newStatus"
                                                    name="newStatus"
                                                    value={formData.newStatus || 'received'}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                >
                                                    <option value="received">Received</option>
                                                    <option value="shortlisted">Shortlisted</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="withdrawn">Withdrawn</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="statusMessage" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Recruiter Message (Optional)
                                                </label>
                                                <textarea
                                                    id="statusMessage"
                                                    name="statusMessage"
                                                    value={formData.statusMessage || ''}
                                                    onChange={handleInputChange}
                                                    rows={3}
                                                    placeholder="We were impressed with your application..."
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                        {formData.scenario === 'generic' && (
                            <div className="space-y-4 p-6 bg-green-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Generic Notification</h3>

                                <div>
                                    <label htmlFor="emailTitle" className="block text-sm font-medium text-gray-700 mb-2">
                                        Notification Title
                                    </label>
                                    <input
                                        type="text"
                                        id="emailTitle"
                                        name="emailTitle"
                                        value={formData.emailTitle || ''}
                                        onChange={handleInputChange}
                                        placeholder="Important Update"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="emailMessage" className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="emailMessage"
                                        name="emailMessage"
                                        value={formData.emailMessage || ''}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Your custom message here..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all duration-200 ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    '📧 Send Test Email & Create Notification'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Info Box */}
                    <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                        <div className="flex">
                            <div className="shrink-0">
                                <svg
                                    className="h-5 w-5 text-yellow-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Note:</strong> This page is for testing purposes only. In production, these
                                    notifications will be triggered automatically based on user actions (resume uploads,
                                    job applications, status updates, etc.).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
