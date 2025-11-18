'use client';

import { useState } from 'react';
import InputUploadFile from '@/components/shared/inputs/InputUploadFile';
import ButtonFilledBlack from '@/components/shared/buttons/ButtonFilledBlack';
import { fetchFromFastAPI } from '@/utils/api';
import { ApiResponse, ResumeData, isSuccessResponse } from '@/types/fastapi.types';
import JobHeader from './JobHeader';
import { JobDetails } from '@/types/job.types';

interface ResumeUploadStepProps {
    job: JobDetails;
    onUploadSuccess: (data: ResumeData, file: File) => void;
    onBack: () => void;
}

/**
 * ResumeUploadStep - Step 1: Upload resume and extract information
 */
export default function ResumeUploadStep({
    job,
    onUploadSuccess,
    onBack,
}: ResumeUploadStepProps) {
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleResumeUpload = async () => {
        if (!cvFile) {
            setErrorMessage('Please upload your resume to continue.');
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

            const result = (await fetchFromFastAPI(endpoint, {
                method: 'POST',
                body: formData,
            })) as ApiResponse<ResumeData>;

            if (!isSuccessResponse(result)) {
                throw new Error(result.message || 'Failed to extract resume data');
            }

            console.log('Extracted resume data:', result.data);
            onUploadSuccess(result.data, cvFile);
        } catch (err) {
            console.error(err);
            setErrorMessage('Resume processing failed. Please try again.');
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center bg-gray-50 py-25">
            <div className="bg-white shadow-md rounded-2xl p-10 w-full max-w-2xl">
                <JobHeader job={job} onBack={onBack} />

                <h2 className="text-2xl font-bold mb-4">Upload Your Resume</h2>
                <p className="text-gray-500 text-sm mb-6">
                    Upload your resume for automatic information extraction.
                </p>

                {errorMessage && (
                    <div className="text-red-500 bg-red-50 border border-red-200 px-4 py-2 rounded-md mb-6 text-center">
                        {errorMessage}
                    </div>
                )}

                <InputUploadFile
                    label="Resume (PDF or Image)"
                    className="w-full"
                    accept=".pdf,image/*"
                    onChange={(file) => setCvFile(file)}
                />

                <ButtonFilledBlack
                    text={isExtracting ? 'Processing...' : 'Continue'}
                    className="w-full py-3 mt-6"
                    disabled={isExtracting}
                    onClick={handleResumeUpload}
                />
            </div>
        </div>
    );
}
