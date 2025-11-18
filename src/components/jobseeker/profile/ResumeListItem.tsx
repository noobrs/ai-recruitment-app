'use client';

import { Resume } from '@/types';
import { formatDate } from '@/utils/utils';

interface ResumeListItemProps {
    resume: Resume;
    index: number;
    isSettingProfile: boolean;
    onSetAsProfile: (resumeId: number) => void;
}

/**
 * ResumeListItem Component
 * 
 * Responsible for displaying a single resume item in the list.
 * Single Responsibility: Individual resume item display and actions.
 */
export default function ResumeListItem({
    resume,
    index,
    isSettingProfile,
    onSetAsProfile,
}: ResumeListItemProps) {
    return (
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:border-primary transition-colors">
            <div className="flex items-center gap-3">
                <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                            Resume {resume.resume_id}
                        </p>
                        {resume.is_profile && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                Profile
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Uploaded {formatDate(resume.created_at)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <a
                    href={resume.original_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                    View
                </a>
                {!resume.is_profile && (
                    <button
                        onClick={() => onSetAsProfile(resume.resume_id)}
                        disabled={isSettingProfile}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isSettingProfile ? 'Setting...' : 'Set as Profile'}
                    </button>
                )}
            </div>
        </div>
    );
}
