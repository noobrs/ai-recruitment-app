'use client';

import { useState, useEffect, useRef } from 'react';
import { ResumeData } from '@/types/fastapi.types';
import { uploadResumeToProfile } from '@/app/jobseeker/profile/actions';
import { validateResumeFile } from '@/constants/resume.constants';
import { saveResumeToDatabase } from '@/app/actions/resume.actions';
import SkillsEditor from '../shared/editors/SkillsEditor';
import ExperienceEditor from '../shared/editors/ExperienceEditor';
import EducationEditor from '../shared/editors/EducationEditor';
import ResumeValidationWarning from '@/components/jobseeker/jobs/apply/ResumeValidationWarning';
import toast from 'react-hot-toast';

interface ResumeUploadDialogProps {
    jobSeekerId: number;
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * ResumeUploadDialog Component
 * 
 * Handles the two-step resume upload process:
 * 1. Extract resume data via FastAPI
 * 2. Allow user to review/edit and save to database (using same components as job application)
 */
export default function ResumeUploadDialog({
    jobSeekerId,
    onSuccess,
    onCancel,
}: ResumeUploadDialogProps) {
    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [extractedData, setExtractedData] = useState<ResumeData | null>(null);
    const [redactedFileUrl, setRedactedFileUrl] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Prevent background scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validationError = validateResumeFile(file);
            if (validationError) {
                toast.error(validationError);
                setError(validationError);
                setSelectedFile(null);
                event.target.value = '';
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleExtract = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setIsExtracting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('job_seeker_id', jobSeekerId.toString());

            const result = await uploadResumeToProfile(formData);

            if (result.success && result.extractedData) {
                setExtractedData(result.extractedData);
                setRedactedFileUrl(result.redactedFileUrl || null);
                setStep('review');
            } else {
                throw new Error('Failed to extract resume data');
            }
        } catch (err) {
            console.error('Extraction error:', err);
            setError(err instanceof Error ? err.message : 'Failed to extract resume data');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!selectedFile || !extractedData) {
            setError('Missing file or extracted data');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await saveResumeToDatabase(selectedFile, extractedData, false, redactedFileUrl);
            onSuccess();
        } catch (err) {
            console.error('Save error:', err);
            setError(err instanceof Error ? err.message : 'Failed to save resume');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {step === 'upload' ? 'Upload Resume' : 'Review Extracted Data'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Upload Step */}
                    {step === 'upload' && (
                        <div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Select Resume (PDF, JPG, PNG only - max 20MB)
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileSelect}
                                    disabled={isExtracting}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {selectedFile && (
                                    <p className="mt-2 text-sm text-gray-600">
                                        Selected: {selectedFile.name}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExtract}
                                    disabled={!selectedFile || isExtracting}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isExtracting ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review Step */}
                    {step === 'review' && extractedData && (
                        <div>
                            <p className="text-sm text-gray-600 mb-6">
                                Review and edit the extracted information before saving your resume.
                            </p>

                            <ResumeValidationWarning resumeData={extractedData} />

                            <div className="mb-6 space-y-6 max-h-[40vh] overflow-y-auto pr-2">
                                {/* Skills Editor */}
                                <SkillsEditor
                                    skills={extractedData.skills}
                                    onChange={(skills) => setExtractedData({ ...extractedData, skills })}
                                    disabled={isSaving}
                                />

                                {/* Experience Editor */}
                                <ExperienceEditor
                                    experiences={extractedData.experience}
                                    onChange={(experience) => setExtractedData({ ...extractedData, experience })}
                                    disabled={isSaving}
                                />

                                {/* Education Editor */}
                                <EducationEditor
                                    education={extractedData.education}
                                    onChange={(education) => setExtractedData({ ...extractedData, education })}
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="flex justify-center gap-3 border-t pt-4">
                                <button
                                    onClick={() => {
                                        setStep('upload');
                                        setSelectedFile(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => handleSave()}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
