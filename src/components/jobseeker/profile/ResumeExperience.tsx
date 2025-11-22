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
 * Responsible for displaying the extracted work experience from resume in a card.
 * Single Responsibility: Experience display.
 */
export default function ResumeExperience({ experiences }: ResumeExperienceProps) {
    if (!experiences || experiences.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Experience
            </h3>
            <div className="space-y-3">
                {experiences.map((exp, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <h4 className="font-semibold text-gray-900 text-base">{exp.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{exp.company}</p>
                        <p className="text-sm text-gray-500 mt-1">{exp.duration}</p>
                        {exp.description && (
                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">{exp.description}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
