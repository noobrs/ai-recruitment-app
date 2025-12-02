import { ResumeData } from '@/types/fastapi.types';

interface ResumeValidationWarningProps {
    resumeData: ResumeData;
}

/**
 * ResumeValidationWarning Component
 * 
 * Displays a warning banner when resume sections (skills, experience, education) are empty.
 * Provides specific feedback for each missing section.
 */
export default function ResumeValidationWarning({ resumeData }: ResumeValidationWarningProps) {
    const hasEmptySections =
        resumeData.skills.length === 0 ||
        resumeData.experience.length === 0 ||
        resumeData.education.length === 0;

    if (!hasEmptySections) {
        return null;
    }

    return (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
                <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                        Missing Information
                    </h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        {resumeData.skills.length === 0 && (
                            <li>• No skills were extracted. Please add your skills manually.</li>
                        )}
                        {resumeData.experience.length === 0 && (
                            <li>• No work experience was extracted. Please add your experience manually.</li>
                        )}
                        {resumeData.education.length === 0 && (
                            <li>• No education was extracted. Please add your education manually.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
