'use client';

export interface Education {
    degree: string;
    institution: string;
    year: string;
}

interface ResumeEducationProps {
    education: Education[];
}

/**
 * ResumeEducation Component
 * 
 * Responsible for displaying the extracted education from resume in a card.
 * Single Responsibility: Education display.
 */
export default function ResumeEducation({ education }: ResumeEducationProps) {
    if (!education || education.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Education
            </h3>
            <div className="space-y-3">
                {education.map((edu, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <h4 className="font-semibold text-gray-900 text-base">{edu.degree}</h4>
                        <p className="text-sm text-gray-600 mt-1">{edu.institution}</p>
                        <p className="text-sm text-gray-500 mt-1">{edu.year}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
