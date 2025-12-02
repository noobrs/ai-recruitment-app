'use client';

import { Resume } from '@/types';
import { useRouter } from 'next/navigation';
import ResumeSkills from './ResumeSkills';
import ResumeExperience from './ResumeExperience';
import ResumeEducation from './ResumeEducation';
import { EducationOut, ExperienceOut } from '@/types';

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
    const router = useRouter();
    const skills = resume.extracted_skills ? JSON.parse(resume.extracted_skills) : [];
    const experiences = resume.extracted_experiences ? JSON.parse(resume.extracted_experiences) as ExperienceOut[] : [];
    const education = resume.extracted_education ? JSON.parse(resume.extracted_education) as EducationOut[] : [];

    const handleUpdate = () => {
        router.refresh();
    };

    return (
        <div className="space-y-4 mb-6">
            <ResumeSkills
                skills={skills}
                resumeId={resume.resume_id}
                onUpdate={handleUpdate}
            />
            <ResumeExperience
                experiences={experiences}
                resumeId={resume.resume_id}
                onUpdate={handleUpdate}
            />
            <ResumeEducation
                education={education}
                resumeId={resume.resume_id}
                onUpdate={handleUpdate}
            />
        </div>
    );
}
