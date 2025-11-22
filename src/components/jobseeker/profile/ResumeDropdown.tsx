'use client';

import { Resume } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResumeUploadDialog from './ResumeUploadDialog';

interface ResumeDropdownProps {
    resumes: Resume[];
    profileResume: Resume | null;
    settingProfileId: number | null;
    onSetAsProfile: (resumeId: number) => void;
    onDeleteResume: (resumeId: number) => void;
    jobSeekerId: number;
    deletingResumeId: number | null;
}

/**
 * ResumeDropdown Component
 *
 * Responsible for displaying resumes in a dropdown format with default (profile) resume shown first.
 * Single Responsibility: Resume dropdown orchestration with delete functionality.
 */
export default function ResumeDropdown({
    resumes,
    profileResume,
    settingProfileId,
    onSetAsProfile,
    onDeleteResume,
    jobSeekerId,
    deletingResumeId,
}: ResumeDropdownProps) {
    const router = useRouter();
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(profileResume);

    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const handleUploadSuccess = () => {
        setShowUploadDialog(false);
        router.refresh();
    };

    const handleSelectResume = (resume: Resume) => {
        // Only allow selecting the default/profile resume
        if (!resume.is_profile) return;
        setSelectedResume(resume);
        setIsOpen(false);
    };

    const handleSetAsProfile = (e: React.MouseEvent, resumeId: number) => {
        e.stopPropagation();
        onSetAsProfile(resumeId);
    };

    const handleDeleteResume = (e: React.MouseEvent, resumeId: number) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this resume?')) {
            onDeleteResume(resumeId);
        }
    };

    const handleViewResume = (e: React.MouseEvent, resume: Resume) => {
        e.stopPropagation();
        if (!resume.original_file_path) return;
        // Open the original resume file in a new tab
        window.open(resume.original_file_path, '_blank', 'noopener,noreferrer');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Sort resumes: default/profile resume first, then by created date
    const sortedResumes = [...resumes].sort((a, b) => {
        if (a.is_profile) return -1;
        if (b.is_profile) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Sync selected resume with profileResume + handle deletion
    useEffect(() => {
        if (profileResume) {
            setSelectedResume(profileResume);
        } else {
            // If profile is removed and selected resume no longer exists in list, clear it
            setSelectedResume((prev) =>
                prev && resumes.some((r) => r.resume_id === prev.resume_id) ? prev : null
            );
        }
    }, [profileResume, resumes]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
                <button
                    onClick={() => setShowUploadDialog(true)}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Resume
                </button>
            </div>

            {resumes.length === 0 ? (
                <EmptyResumesState />
            ) : (
                <div className="relative" ref={dropdownRef}>
                    {/* Dropdown Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">
                                    {selectedResume
                                        ? `Resume - ${formatDate(selectedResume.created_at)}`
                                        : 'No default resume selected'}
                                    {selectedResume?.is_profile && (
                                        <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            {sortedResumes.map((resume) => {
                                const isDefault = resume.is_profile;
                                const isSelected = selectedResume?.resume_id === resume.resume_id;

                                return (
                                    <div
                                        key={resume.resume_id}
                                        className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${isDefault ? 'cursor-pointer' : 'cursor-default'
                                            } ${isSelected ? 'bg-gray-50' : ''}`}
                                        onClick={() => handleSelectResume(resume)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <svg
                                                        className="w-4 h-4 text-gray-400"
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
                                                    <span className="font-medium text-gray-900">
                                                        Resume - {formatDate(resume.created_at)}
                                                    </span>
                                                    {isDefault ? (
                                                        <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                                            Default
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => handleSetAsProfile(e, resume.resume_id)}
                                                            disabled={settingProfileId === resume.resume_id}
                                                            className="px-3 py-1 text-xs font-medium text-primary border border-primary rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Set as default resume"
                                                        >
                                                            {settingProfileId === resume.resume_id ? (
                                                                <span className="flex items-center gap-1">
                                                                    <svg
                                                                        className="animate-spin h-3 w-3"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <circle
                                                                            className="opacity-25"
                                                                            cx="12"
                                                                            cy="12"
                                                                            r="10"
                                                                            stroke="currentColor"
                                                                            strokeWidth="4"
                                                                        ></circle>
                                                                        <path
                                                                            className="opacity-75"
                                                                            fill="currentColor"
                                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                        ></path>
                                                                    </svg>
                                                                    Setting...
                                                                </span>
                                                            ) : (
                                                                'Set as Default'
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                {/* View Button */}
                                                <button
                                                    onClick={(e) => handleViewResume(e, resume)}
                                                    className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                                    title="View resume"
                                                >
                                                    View
                                                </button>

                                                <button
                                                    onClick={(e) => handleDeleteResume(e, resume.resume_id)}
                                                    disabled={deletingResumeId === resume.resume_id}
                                                    className="px-3 py-1 text-xs font-medium text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete resume"
                                                >
                                                    {deletingResumeId === resume.resume_id ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg
                                                                className="animate-spin h-3 w-3"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle
                                                                    className="opacity-25"
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                    stroke="currentColor"
                                                                    strokeWidth="4"
                                                                ></circle>
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                ></path>
                                                            </svg>
                                                            Deleting...
                                                        </span>
                                                    ) : (
                                                        'Delete'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Resume Count */}
                    <div className="mt-3 text-sm text-gray-500">
                        {resumes.length} resume{resumes.length !== 1 ? 's' : ''} available
                    </div>
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
