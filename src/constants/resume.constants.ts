/**
 * Resume Upload Constants
 * 
 * Configuration for resume file uploads including size limits and validation
 */

// Maximum file size for resume uploads: 20MB
export const MAX_RESUME_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

// Maximum file size in human-readable format
export const MAX_RESUME_FILE_SIZE_MB = 20;

// Human-readable size limit text
export const RESUME_FILE_SIZE_LIMIT_TEXT = 'Max 20MB';

// Accepted file types for resume uploads
export const RESUME_ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png';

/**
 * Formats file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates resume file before upload
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateResumeFile(file: File): string | null {
    if (!file) {
        return 'Please select a file.';
    }

    if (file.size > MAX_RESUME_FILE_SIZE) {
        return `File size exceeds ${RESUME_FILE_SIZE_LIMIT_TEXT} limit. Your file is ${formatFileSize(file.size)}.`;
    }

    // Check file type
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const fileName = file.name.toLowerCase();
    const isJpg = file.type === 'image/jpeg' || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    const isPng = file.type === 'image/png' || fileName.endsWith('.png');

    if (!isPdf && !isJpg && !isPng) {
        return 'Please upload a PDF, JPG, or PNG file only.';
    }

    return null;
}
