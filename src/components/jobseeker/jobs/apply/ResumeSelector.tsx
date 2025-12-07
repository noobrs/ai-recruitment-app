'use client';

import { Resume } from '@/types';
import { useEffect, useRef, useState } from 'react';

interface ResumeSelectorProps {
    resumes: Resume[];
    selectedResumeId: number | null;
    onSelectResume: (resumeId: number) => void;
    disabled?: boolean;
}

/**
 * ResumeSelector Component
 *
 * Dropdown selector for choosing an existing resume during job application.
 * Focused on selection rather than management (no delete/edit features).
 */
export default function ResumeSelector({
    resumes,
    selectedResumeId,
    onSelectResume,
    disabled = false,
}: ResumeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const selectedResume = resumes.find((r) => r.resume_id === selectedResumeId);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleSelectResume = (resume: Resume) => {
        onSelectResume(resume.resume_id);
        setIsOpen(false);
    };

    const handleViewResume = (e: React.MouseEvent, resume: Resume) => {
        e.stopPropagation();
        if (!resume.original_file_path) return;
        window.open(resume.original_file_path, '_blank', 'noopener,noreferrer');
    };

    // Sort resumes: profile/default resume first, then by created date
    const sortedResumes = [...resumes].sort((a, b) => {
        if (a.is_profile) return -1;
        if (b.is_profile) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Auto-select profile resume by default if nothing is selected
    useEffect(() => {
        if (!selectedResumeId && resumes.length > 0) {
            const profileResume = resumes.find((r) => r.is_profile);
            if (profileResume) {
                onSelectResume(profileResume.resume_id);
            }
        }
    }, [resumes, selectedResumeId, onSelectResume]);

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

    if (resumes.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <svg
                    className="w-12 h-12 text-gray-300 mx-auto mb-2"
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
                <p>No resumes found. Upload a new one below.</p>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 bg-white border rounded-lg transition-colors flex items-center justify-between ${disabled
                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                    } ${selectedResume ? 'border-primary' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <svg
                        className={`w-5 h-5 ${selectedResume ? 'text-primary' : 'text-gray-400'}`}
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
                    <div className="text-left">
                        <div className={`font-medium ${selectedResume ? 'text-gray-900' : 'text-gray-500'}`}>
                            {selectedResume ? (
                                <>
                                    {selectedResume.filename || 'Resume'} - {formatDate(selectedResume.created_at)}
                                    {selectedResume.is_profile && (
                                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                            Your Default
                                        </span>
                                    )}
                                </>
                            ) : (
                                'Select a resume'
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
            {isOpen && !disabled && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {sortedResumes.map((resume) => {
                        const isDefault = resume.is_profile;
                        const isSelected = selectedResumeId === resume.resume_id;

                        return (
                            <div
                                key={resume.resume_id}
                                className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${isSelected ? 'bg-primary-soft border-l-4 border-l-primary' : ''
                                    }`}
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
                                                {resume.filename || 'Resume'} - {formatDate(resume.created_at)}
                                            </span>
                                            {isDefault && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                    Your Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 ml-6">
                                            Uploaded {formatDate(resume.created_at)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {/* View Button */}
                                        {resume.original_file_path && (
                                            <button
                                                onClick={(e) => handleViewResume(e, resume)}
                                                className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                                title="View resume"
                                            >
                                                View
                                            </button>
                                        )}

                                        {/* Selection Indicator */}
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected
                                                ? 'border-primary bg-primary'
                                                : 'border-gray-300'
                                                }`}
                                        >
                                            {isSelected && (
                                                <svg
                                                    className="w-3 h-3 text-white"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Resume Count */}
            <div className="mt-2 text-sm text-gray-500">
                {resumes.length} resume{resumes.length !== 1 ? 's' : ''} available
            </div>
        </div>
    );
}
