'use client';

import { Resume } from '@/types';
import ResumeListItem from './ResumeListItem';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadResumeToProfile } from '@/app/jobseeker/profile/actions';

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
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('job_seeker_id', jobSeekerId.toString());

            await uploadResumeToProfile(formData);
            router.refresh();
        } catch (error) {
            console.error('Error uploading resume:', error);
            setUploadError(error instanceof Error ? error.message : 'Failed to upload resume');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{resumes.length} resume(s)</span>
                    <label className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                        {isUploading ? 'Uploading...' : 'Upload Resume'}
                        <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </div>

            {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {uploadError}
                </div>
            )}

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
