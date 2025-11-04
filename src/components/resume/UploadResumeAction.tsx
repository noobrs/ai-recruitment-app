/**
 * Resume Upload Component
 * 
 * Handles the complete resume upload flow:
 * 1. User selects a PDF or image file
 * 2. File is validated and uploaded to Next.js API
 * 3. Next.js uploads to Supabase Storage and triggers FastAPI processing
 * 4. Component subscribes to Supabase Realtime for instant completion updates
 * 5. Shows progress feedback and handles success/error states
 * 
 * Uses Supabase Realtime instead of polling for better performance and UX.
 */
'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
// import {
//     RESUME_ALLOWED_MIME_TYPES,
//     RESUME_IMAGE_MAX_BYTES,
//     RESUME_PDF_MAX_BYTES,
//     isAllowedResumeMime,
// } from '@/constants/resume';
import { createClient } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Progress states that track the resume upload and processing lifecycle
type ProgressState = 'idle' | 'uploading' | 'processing' | 'finished' | 'error';

// Fallback timeout: If Realtime fails, check status once after 30 seconds
const FALLBACK_CHECK_TIMEOUT_MS = 30000;

// Visual progress indicators shown to the user during upload
const PROGRESS_STEPS: Array<{ key: ProgressState; label: string }> = [
    { key: 'uploading', label: 'Uploading' },
    { key: 'processing', label: 'Processing' },
    { key: 'finished', label: 'Finished' },
];

/**
 * Formats file size in bytes to human-readable format (B, KB, MB, GB)
 * @param bytes - File size in bytes
 * @returns Formatted string like "2.5 MB" or "150 KB"
 */
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
    // UI state
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<ProgressState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Resume identifier received after successful upload
    const [resumeId, setResumeId] = useState<number | null>(null);

    // Refs for cleanup: Supabase Realtime channel and fallback timeout
    const channelRef = useRef<RealtimeChannel | null>(null);
    const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Resets all component state and cleans up active connections
     * Called when closing modal or resetting the upload flow
     */
    const resetState = useCallback(() => {
        // Clean up Realtime channel
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }

        // Clean up fallback timeout
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }

        setSelectedFile(null);
        setProgress('idle');
        setError(null);
        setStatusMessage(null);
        setResumeId(null);
    }, []);

    /**
     * Closes the upload modal and resets all state
     */
    const closeModal = useCallback(() => {
        setIsOpen(false);
        resetState();
    }, [resetState]);

    /**
     * Validates file type and size requirements
     * @param file - The file to validate
     * @returns Error message string if invalid, null if valid
     */
    const validateFile = useCallback((file: File) => {
        // if (!isAllowedResumeMime(file.type)) {
        //     return `Unsupported file type. Allowed: ${RESUME_ALLOWED_MIME_TYPES.join(', ')}`;
        // }

        // if (file.type === 'application/pdf' && file.size > RESUME_PDF_MAX_BYTES) {
        //     return 'PDF exceeds 20MB limit.';
        // }

        // if (file.type !== 'application/pdf' && file.size > RESUME_IMAGE_MAX_BYTES) {
        //     return 'Image file exceeds allowed size.';
        // }

        return null;
    }, []);

    /**
     * Handles file input change events
     * Validates the selected file and updates component state
     */
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

    /**
     * Subscribes to Supabase Realtime updates for a specific resume
     * 
     * This replaces the old polling mechanism with instant WebSocket updates.
     * When FastAPI completes processing and Next.js webhook updates the database,
     * we receive an instant notification here.
     * 
     * Also sets up a 30-second fallback check in case Realtime fails.
     * 
     * @param resumeIdentifier - The resume ID to watch for updates
     */
    const subscribeToResumeUpdates = useCallback(
        (resumeIdentifier: number) => {
            // Clean up existing channel if any
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }

            const supabase = createClient();

            // Subscribe to database changes for this specific resume
            // Filter ensures we only get updates for our resume, not others
            const channel = supabase
                .channel(`resume-${resumeIdentifier}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'resume',
                        filter: `resume_id=eq.${resumeIdentifier}`,
                    },
                    (payload) => {
                        console.log('Resume update received:', payload);

                        // Check if processing is complete by looking for redacted_file_path
                        // This field is set by the webhook when FastAPI finishes processing
                        if (payload.new && 'redacted_file_path' in payload.new) {
                            const redactedPath = payload.new.redacted_file_path;

                            if (redactedPath) {
                                setStatusMessage('Resume processed successfully.');
                                setProgress('finished');

                                // Clean up subscription
                                if (channelRef.current) {
                                    channelRef.current.unsubscribe();
                                    channelRef.current = null;
                                }

                                // Clear fallback timeout
                                if (fallbackTimeoutRef.current) {
                                    clearTimeout(fallbackTimeoutRef.current);
                                    fallbackTimeoutRef.current = null;
                                }
                            }
                        }
                    },
                )
                .subscribe((status) => {
                    console.log('Realtime subscription status:', status);

                    // Handle connection status updates
                    if (status === 'SUBSCRIBED') {
                        setStatusMessage('Resume is being processed…');
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        setStatusMessage('Connection issue. Waiting for processing…');
                    }
                });

            channelRef.current = channel;

            // Safety net: If Realtime doesn't work, check status via HTTP after 30 seconds
            // This ensures we don't leave users stuck waiting indefinitely
            fallbackTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/resumes/${resumeIdentifier}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.processingComplete) {
                            setStatusMessage('Resume processed successfully.');
                            setProgress('finished');

                            if (channelRef.current) {
                                channelRef.current.unsubscribe();
                                channelRef.current = null;
                            }
                        }
                    }
                } catch (err) {
                    console.error('Fallback check failed', err);
                }
            }, FALLBACK_CHECK_TIMEOUT_MS);
        },
        [],
    );

    /**
     * Effect: Subscribe to resume updates when processing starts
     * Cleanup: Unsubscribe and clear timeouts when component unmounts or state changes
     */
    useEffect(() => {
        if (progress === 'processing' && resumeId) {
            subscribeToResumeUpdates(resumeId);
        }

        // Clean up on unmount or when dependencies change
        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }

            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
                fallbackTimeoutRef.current = null;
            }
        };
    }, [progress, resumeId, subscribeToResumeUpdates]);

    /**
     * Effect: Show final success message when processing completes
     */
    useEffect(() => {
        if (progress === 'finished') {
            const timeout = setTimeout(() => {
                setStatusMessage('Processed resume is ready.');
            }, 0);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [progress]);

    /**
     * Handles form submission - uploads resume to Next.js API
     * 
     * Flow:
     * 1. Validate file
     * 2. Upload to /api/resumes/upload
     * 3. Receive resumeId
     * 4. Set progress to 'processing'
     * 5. subscribeToResumeUpdates will be triggered by useEffect
     */
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
                // Create multipart form data with the file
                const formData = new FormData();
                formData.append('file', selectedFile);

                // Upload to Next.js API (which handles Supabase Storage + FastAPI trigger)
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

                // Store resume ID for Realtime subscription
                if (payload?.resumeId) {
                    setResumeId(payload.resumeId);
                }

                // Show warning if FastAPI trigger failed (resume uploaded but processing pending)
                if (payload?.warning) {
                    setStatusMessage(payload.warning);
                }

                // Transition to processing state (triggers useEffect to subscribe to Realtime)
                setProgress('processing');
            } catch (err) {
                console.error('Resume upload failed', err);
                setProgress('error');
                setError('Something went wrong while uploading. Please try again.');
            }
        },
        [selectedFile, validateFile],
    );

    /**
     * Renders progress indicator pills showing upload → processing → finished
     * Changes color based on current state
     */
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
                                    // accept={RESUME_ALLOWED_MIME_TYPES.join(',')}
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
