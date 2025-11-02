'use client';

export interface Experience {
    title: string;
    company: string;
    duration: string;
    description?: string;
}

interface ResumeExperienceProps {
    experiences: Experience[];
}

/**
 * ResumeExperience Component
 * 
 * Responsible for displaying the extracted work experience from resume.
 * Single Responsibility: Experience display.
 */
export default function ResumeExperience({ experiences }: ResumeExperienceProps) {
    if (!experiences || experiences.length === 0) return null;

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience</h3>
            <div className="space-y-3">
                {experiences.map((exp, index) => (
                    <div key={index} className="border-l-2 border-gray-300 pl-4">
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">{exp.duration}</p>
                        {exp.description && (
                            <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
