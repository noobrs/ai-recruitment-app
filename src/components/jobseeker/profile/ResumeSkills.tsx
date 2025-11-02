'use client';

interface ResumeSkillsProps {
    skills: string[];
}

/**
 * ResumeSkills Component
 * 
 * Responsible for displaying the extracted skills from resume.
 * Single Responsibility: Skills display.
 */
export default function ResumeSkills({ skills }: ResumeSkillsProps) {
    if (!skills || skills.length === 0) return null;

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                    <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                        {skill}
                    </span>
                ))}
            </div>
        </div>
    );
}
