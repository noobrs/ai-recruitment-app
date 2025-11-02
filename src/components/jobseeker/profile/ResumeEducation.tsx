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
 * Responsible for displaying the extracted education from resume.
 * Single Responsibility: Education display.
 */
export default function ResumeEducation({ education }: ResumeEducationProps) {
    if (!education || education.length === 0) return null;

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Education</h3>
            <div className="space-y-2">
                {education.map((edu, index) => (
                    <div key={index}>
                        <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">{edu.year}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
