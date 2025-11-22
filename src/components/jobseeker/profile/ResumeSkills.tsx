'use client';

interface ResumeSkillsProps {
    skills: string[];
}

/**
 * ResumeSkills Component
 * 
 * Responsible for displaying the extracted skills from resume in a card.
 * Single Responsibility: Skills display.
 */
export default function ResumeSkills({ skills }: ResumeSkillsProps) {
    if (!skills || skills.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Skills
            </h3>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                    <span
                        key={index}
                        className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium"
                    >
                        {skill}
                    </span>
                ))}
            </div>
        </div>
    );
}
