'use client';

import { useState, useEffect } from 'react';
import InputUploadFile from '@/components/shared/inputs/InputUploadFile';
import { MAX_RESUME_FILE_SIZE_MB, validateResumeFile } from '@/constants/resume.constants';
import ButtonFilledBlack from '@/components/shared/buttons/ButtonFilledBlack';
import { fetchFromFastAPI } from '@/utils/api';
import { ApiResponse, ResumeData, isSuccessResponse } from '@/types/fastapi.types';
import JobHeader from './JobHeader';
import { JobDetails } from '@/types/job.types';
import { Resume } from '@/types';
import ResumeSelector from './ResumeSelector';
import toast from 'react-hot-toast';

interface ResumeUploadStepProps {
    job: JobDetails;
    onUploadSuccess: (data: ResumeData, file: File | null, resumeId?: number, redactedUrl?: string | null) => void;
    onBack: () => void;
}

/**
 * ResumeUploadStep - Step 1: Select existing resume or upload new one
 */
export default function ResumeUploadStep({
    job,
    onUploadSuccess,
    onBack,
}: ResumeUploadStepProps) {
    const [mode, setMode] = useState<'select' | 'upload'>('select');
    const [existingResumes, setExistingResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch existing resumes on mount
    useEffect(() => {
        async function fetchResumes() {
            try {
                const response = await fetch('/api/jobseeker/resumes');
                if (response.ok) {
                    const data = await response.json();
                    setExistingResumes(data.resumes || []);
                }
            } catch (error) {
                console.error('Error fetching resumes:', error);
            }
        }
        fetchResumes();
    }, []);

    const handleSelectExisting = async () => {
        if (!selectedResumeId) {
            setErrorMessage('Please select a resume.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const selectedResume = existingResumes.find(r => r.resume_id === selectedResumeId);
            if (!selectedResume) {
                throw new Error('Resume not found');
            }

            // Convert stored data to ResumeData format
            const resumeData: ResumeData = {
                candidate: {
                    name: '',
                    email: '',
                    phone: '',
                    location: '',
                },
                skills: selectedResume.extracted_skills ? JSON.parse(selectedResume.extracted_skills) : [],
                experience: selectedResume.extracted_experiences ? JSON.parse(selectedResume.extracted_experiences) : [],
                education: selectedResume.extracted_education ? JSON.parse(selectedResume.extracted_education) : [],
                certifications: [],
                activities: [],
            };

            onUploadSuccess(resumeData, null, selectedResumeId);
        } catch (err) {
            console.error(err);
            setErrorMessage('Failed to load resume data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResumeUpload = async () => {
        if (!cvFile) {
            setErrorMessage('Please upload your resume to continue.');
            return;
        }

        // Validate file before processing
        const validationError = validateResumeFile(cvFile);
        if (validationError) {
            toast.error(validationError);
            setErrorMessage(validationError);
            return;
        }

        setIsExtracting(true);
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('file', cvFile);

            // Detect file type and route to appropriate endpoint
            const isPdf =
                cvFile.type === 'application/pdf' ||
                cvFile.name.toLowerCase().endsWith('.pdf');
            const endpoint = isPdf ? '/api/py/process-pdf' : '/api/py/process-image';

            console.log(
                `Processing ${isPdf ? 'PDF' : 'image'} resume via ${endpoint}`
            );

            // Call FastAPI directly for extraction only (no DB save)
            const result = (await fetchFromFastAPI(endpoint, {
                method: 'POST',
                body: formData,
            })) as ApiResponse<ResumeData>;

            if (!isSuccessResponse(result)) {
                throw new Error(result.message || 'Failed to extract resume data');
            }

            console.log('Extracted resume data:', result.data);
            console.log('Redacted file URL:', result.redacted_file_url);
            // Pass extracted data, file, and redacted URL to parent - resume will be saved when application is submitted
            onUploadSuccess(result.data, cvFile, undefined, result.redacted_file_url);
        } catch (err) {
            console.error(err);
            setErrorMessage('Resume processing failed. Please try again.');
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center bg-gray-50 py-10">
            <div className="bg-white shadow-md rounded-2xl p-10 w-full max-w-2xl">
                <JobHeader job={job} onBack={onBack} />

                <h2 className="text-2xl font-bold mb-4">Choose Your Resume</h2>
                <p className="text-gray-500 text-sm mb-6">
                    Select an existing resume or upload a new one.
                </p>

                {/* Mode Toggle Buttons */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setMode('select')}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${mode === 'select'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                            }`}
                    >
                        Choose Existing
                    </button>
                    <button
                        onClick={() => setMode('upload')}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${mode === 'upload'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                            }`}
                    >
                        Upload New
                    </button>
                </div>

                {errorMessage && (
                    <div className="text-red-500 bg-red-50 border border-red-200 px-4 py-2 rounded-md mb-6 text-center">
                        {errorMessage}
                    </div>
                )}

                {mode === 'select' ? (
                    <>
                        <div className="mb-6">
                            <ResumeSelector
                                resumes={existingResumes}
                                selectedResumeId={selectedResumeId}
                                onSelectResume={setSelectedResumeId}
                                disabled={isLoading}
                            />
                        </div>

                        {existingResumes.length > 0 && (
                            <ButtonFilledBlack
                                text={isLoading ? 'Loading...' : 'Continue'}
                                className="w-full py-3"
                                disabled={isLoading || !selectedResumeId}
                                onClick={handleSelectExisting}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <InputUploadFile
                            label="Resume (PDF or Image)"
                            className="w-full"
                            accept=".pdf,.jpg,.jpeg,.png"
                            maxSizeMB={MAX_RESUME_FILE_SIZE_MB}
                            onChange={(file) => setCvFile(file)}
                        />

                        <ButtonFilledBlack
                            text={isExtracting ? 'Processing...' : 'Continue'}
                            className="w-full py-3 mt-6"
                            disabled={isExtracting || cvFile === null}
                            onClick={handleResumeUpload}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
