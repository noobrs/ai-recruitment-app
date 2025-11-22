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
        <div className="space-y-4 mb-6">
            <ResumeSkills skills={skills} />
            <ResumeExperience experiences={experiences} />
            <ResumeEducation education={education} />
        </div>
    );
}
