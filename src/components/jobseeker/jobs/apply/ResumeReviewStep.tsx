'use client';

import { useState } from 'react';
import ButtonFilledBlack from '@/components/shared/buttons/ButtonFilledBlack';
import { ResumeData } from '@/types/fastapi.types';
import { submitApplication } from '../../../../app/jobseeker/jobs/apply/[job_id]/actions';
import JobHeader from './JobHeader';
import SkillsEditor from './SkillsEditor';
import ExperienceEditor from './ExperienceEditor';
import EducationEditor from './EducationEditor';
import { JobDetails } from '@/types/job.types';

interface ResumeReviewStepProps {
    job: JobDetails;
    resumeData: ResumeData;
    cvFile: File;
    jobId: string;
    onBack: () => void;
    onSuccess: () => void;
}

/**
 * ResumeReviewStep - Step 2: Review and edit extracted resume information
 */
export default function ResumeReviewStep({
    job,
    resumeData: initialResumeData,
    cvFile,
    jobId,
    onBack,
    onSuccess,
}: ResumeReviewStepProps) {
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [agreePolicy, setAgreePolicy] = useState(false);

    const handleSubmit = async () => {
        if (!agreePolicy) {
            setErrorMessage('Please agree to the Privacy Policy before submitting.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('job_id', jobId);
            formData.append('cvFile', cvFile);
            formData.append('extracted_skills', JSON.stringify(resumeData.skills));
            formData.append('extracted_experiences', JSON.stringify(resumeData.experience));
            formData.append('extracted_education', JSON.stringify(resumeData.education));

            const result = await submitApplication(formData);
            if (result.success) {
                onSuccess();
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to submit application.';
            setErrorMessage(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-10">
            <div className="bg-white shadow-md rounded-2xl p-10 w-full max-w-3xl">
                <JobHeader job={job} onBack={onBack} />

                <h2 className="text-2xl font-bold mb-6">
                    Review & Edit Extracted Information
                </h2>

                <div className="flex flex-col gap-8 text-gray-700">
                    <SkillsEditor
                        skills={resumeData.skills}
                        onChange={(skills) => setResumeData({ ...resumeData, skills })}
                    />

                    <ExperienceEditor
                        experiences={resumeData.experience}
                        onChange={(experience) => setResumeData({ ...resumeData, experience })}
                    />

                    <EducationEditor
                        education={resumeData.education}
                        onChange={(education) => setResumeData({ ...resumeData, education })}
                    />
                </div>

                {/* Privacy Policy Checkbox */}
                <div className="flex items-start gap-3 mt-6 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={agreePolicy}
                        onChange={(e) => setAgreePolicy(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                    />
                    <span>
                        By submitting this application, I agree to the{' '}
                        <a href="/privacy-policy" className="text-blue-600 underline">
                            Privacy Policy
                        </a>{' '}
                        and confirm that Jobior may store my resume information to process
                        my application.
                    </span>
                </div>

                {errorMessage && (
                    <div className="text-red-500 mt-4 text-center">{errorMessage}</div>
                )}

                <ButtonFilledBlack
                    text={isSubmitting ? 'Submitting...' : 'Submit Application'}
                    className="w-full py-3 mt-6"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                />
            </div>
        </div>
    );
}
