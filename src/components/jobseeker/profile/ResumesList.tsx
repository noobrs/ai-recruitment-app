'use client';

import { Resume } from '@/types';
import ResumeListItem from './ResumeListItem';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ResumeUploadDialog from './ResumeUploadDialog';

interface ResumesListProps {
    resumes: Resume[];
    settingProfileId: number | null;
    onSetAsProfile: (resumeId: number) => void;
    jobSeekerId: number;
}

/**
 * ResumesList Component
 * 
 * Responsible for displaying all user's resumes with upload functionality.
 * Single Responsibility: Resumes list orchestration and upload.
 */
export default function ResumesList({
    resumes,
    settingProfileId,
    onSetAsProfile,
    jobSeekerId,
}: ResumesListProps) {
    const router = useRouter();
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    const handleUploadSuccess = () => {
        setShowUploadDialog(false);
        router.refresh();
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{resumes.length} resume(s)</span>
                    <button
                        onClick={() => setShowUploadDialog(true)}
                        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Upload Resume
                    </button>
                </div>
            </div>

            {resumes.length === 0 ? (
                <EmptyResumesState />
            ) : (
                <div className="space-y-3">
                    {resumes.map((resume, index) => (
                        <ResumeListItem
                            key={resume.resume_id}
                            resume={resume}
                            index={index}
                            isSettingProfile={settingProfileId === resume.resume_id}
                            onSetAsProfile={onSetAsProfile}
                        />
                    ))}
                </div>
            )}

            {/* Upload Dialog */}
            {showUploadDialog && (
                <ResumeUploadDialog
                    jobSeekerId={jobSeekerId}
                    onSuccess={handleUploadSuccess}
                    onCancel={() => setShowUploadDialog(false)}
                />
            )}
        </div>
    );
}

/**
 * EmptyResumesState Component
 * 
 * Displays empty state when user has no resumes.
 */
function EmptyResumesState() {
    return (
        <div className="text-center py-8">
            <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
            <p className="text-gray-500 mb-4">No resumes uploaded yet</p>
        </div>
    );
}
