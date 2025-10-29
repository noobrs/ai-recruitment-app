'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
    RESUME_ALLOWED_MIME_TYPES,
    RESUME_IMAGE_MAX_BYTES,
    RESUME_PDF_MAX_BYTES,
    isAllowedResumeMime,
} from '@/constants/resume';

type ProgressState = 'idle' | 'uploading' | 'processing' | 'finished' | 'error';

const POLL_INTERVAL_MS = 3000;

const PROGRESS_STEPS: Array<{ key: ProgressState; label: string }> = [
    { key: 'uploading', label: 'Uploading' },
    { key: 'processing', label: 'Processing' },
    { key: 'finished', label: 'Finished' },
];

function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes)) {
        return '';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let value = bytes;

    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i += 1;
    }

    return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function UploadResumeAction() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<ProgressState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [resumeId, setResumeId] = useState<number | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const resetState = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        setSelectedFile(null);
        setProgress('idle');
        setError(null);
        setStatusMessage(null);
        setResumeId(null);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        resetState();
    }, [resetState]);

    const validateFile = useCallback((file: File) => {
        if (!isAllowedResumeMime(file.type)) {
            return `Unsupported file type. Allowed: ${RESUME_ALLOWED_MIME_TYPES.join(', ')}`;
        }

        if (file.type === 'application/pdf' && file.size > RESUME_PDF_MAX_BYTES) {
            return 'PDF exceeds 20MB limit.';
        }

        if (file.type !== 'application/pdf' && file.size > RESUME_IMAGE_MAX_BYTES) {
            return 'Image file exceeds allowed size.';
        }

        return null;
    }, []);

    const handleFileChange = useCallback(
        (fileList: FileList | null) => {
            if (!fileList || fileList.length === 0) {
                setSelectedFile(null);
                return;
            }

            const file = fileList[0];
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                setSelectedFile(null);
                return;
            }

            setError(null);
            setStatusMessage(null);
            setSelectedFile(file);
        },
        [validateFile],
    );

    const startPolling = useCallback(
        (resumeIdentifier: number) => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }

            const poll = async () => {
                try {
                    const response = await fetch(`/api/resumes/${resumeIdentifier}`);
                    if (!response.ok) {
                        if (response.status >= 500) {
                            setStatusMessage('Waiting for resume processing service…');
                        }
                        return;
                    }
                    const data = await response.json();
                    if (data.processingComplete) {
                        setStatusMessage('Resume processed successfully.');
                        setProgress('finished');
                        if (pollRef.current) {
                            clearInterval(pollRef.current);
                            pollRef.current = null;
                        }
                    } else {
                        setStatusMessage('Resume is being processed…');
                    }
                } catch (err) {
                    console.error('Failed to poll resume status', err);
                    setStatusMessage('Unable to check processing status. Retrying…');
                }
            };

            poll();
            pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
        },
        [],
    );

    useEffect(() => {
        if (progress === 'processing' && resumeId) {
            startPolling(resumeId);
        }

        if (progress !== 'processing' && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [progress, resumeId, startPolling]);

    useEffect(() => {
        if (progress === 'finished') {
            const timeout = setTimeout(() => {
                setStatusMessage('Processed resume is ready.');
            }, 0);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [progress]);

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!selectedFile) {
                setError('Please choose a resume to upload.');
                return;
            }

            const validationError = validateFile(selectedFile);
            if (validationError) {
                setError(validationError);
                return;
            }

            setError(null);
            setStatusMessage(null);
            setProgress('uploading');

            try {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const response = await fetch('/api/resumes/upload', {
                    method: 'POST',
                    body: formData,
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setProgress('error');
                    setError(payload?.error || 'Failed to upload resume.');
                    return;
                }

                if (payload?.resumeId) {
                    setResumeId(payload.resumeId);
                }

                if (payload?.warning) {
                    setStatusMessage(payload.warning);
                }

                setProgress('processing');
            } catch (err) {
                console.error('Resume upload failed', err);
                setProgress('error');
                setError('Something went wrong while uploading. Please try again.');
            }
        },
        [selectedFile, validateFile],
    );

    const renderProgress = () => {
        if (progress === 'idle') {
            return null;
        }

        return (
            <div className="mt-4 flex items-center space-x-3">
                {PROGRESS_STEPS.map((step, index) => {
                    const currentIndex = PROGRESS_STEPS.findIndex((s) => s.key === progress);
                    const isActive = index <= currentIndex && currentIndex !== -1;
                    const isComplete = index < currentIndex;
                    const base =
                        'flex h-8 items-center rounded-full border px-3 text-sm transition-colors';
                    const stateClass = (() => {
                        if (progress === 'error' && index === 0) {
                            return 'border-red-500 text-red-600 bg-red-50';
                        }
                        if (isComplete) {
                            return 'border-green-500 bg-green-50 text-green-700';
                        }
                        if (isActive) {
                            return 'border-indigo-500 bg-indigo-50 text-indigo-600';
                        }
                        return 'border-gray-200 text-gray-500';
                    })();

                    return (
                        <span key={step.key} className={`${base} ${stateClass}`}>
                            {step.label}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
                <span className="text-sm font-medium">Upload Resume</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Upload Resume</h2>
                            <button
                                type="button"
                                aria-label="Close resume upload dialog"
                                onClick={closeModal}
                                className="rounded-md border border-transparent p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <form className="px-6 py-4" onSubmit={handleSubmit}>
                            <p className="text-sm text-gray-600">
                                Accepted formats: PDF or image files. PDF resumes must be under 20MB.
                            </p>

                            <label
                                htmlFor="resume-input"
                                className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center transition hover:border-indigo-500 hover:bg-indigo-50"
                            >
                                <span className="text-sm font-medium text-indigo-600">
                                    Click to choose a file
                                </span>
                                <span className="mt-2 text-xs text-gray-500">
                                    {selectedFile
                                        ? `${selectedFile.name} • ${formatBytes(selectedFile.size)}`
                                        : 'No file selected'}
                                </span>
                                <input
                                    id="resume-input"
                                    type="file"
                                    accept={RESUME_ALLOWED_MIME_TYPES.join(',')}
                                    className="hidden"
                                    onChange={(event) => handleFileChange(event.target.files)}
                                />
                            </label>

                            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                            {statusMessage && !error && (
                                <p className="mt-3 text-sm text-gray-600">{statusMessage}</p>
                            )}

                            {renderProgress()}

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={progress === 'uploading' || progress === 'processing'}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                                >
                                    {progress === 'uploading'
                                        ? 'Uploading…'
                                        : progress === 'processing'
                                        ? 'Processing…'
                                        : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
