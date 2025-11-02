'use client';

import { Resume } from '@/types';
import ResumeSkills from './ResumeSkills';
import ResumeExperience, { Experience } from './ResumeExperience';
import ResumeEducation, { Education } from './ResumeEducation';

interface ProfileResumeCardProps {
    resume: Resume;
}

/**
 * ProfileResumeCard Component
 * 
 * Responsible for displaying the user's profile resume with all extracted data.
 * Single Responsibility: Profile resume card orchestration.
 */
export default function ProfileResumeCard({ resume }: ProfileResumeCardProps) {
    const skills = resume.extracted_skills ? JSON.parse(resume.extracted_skills) : [];
    const experiences = resume.extracted_experiences ? JSON.parse(resume.extracted_experiences) as Experience[] : [];
    const education = resume.extracted_education ? JSON.parse(resume.extracted_education) as Education[] : [];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Profile Resume
            </h2>

            <div className="space-y-4">
                <ResumeSkills skills={skills} />
                <ResumeExperience experiences={experiences} />
                <ResumeEducation education={education} />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                    Uploaded on {new Date(resume.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>
        </div>
    );
}
