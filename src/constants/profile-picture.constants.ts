/**
 * Profile Picture Constants
 * 
 * Centralized constants for profile picture upload validation and configuration
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const BUCKET_NAME = 'profile-pictures';

export const FILE_SIZE_LIMIT_TEXT = 'Max 5MB';

export const ALLOWED_FORMATS_TEXT = 'JPEG, PNG, WebP';

/**
 * Formats file size in bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validates if a file meets the requirements for profile picture upload
 */
export function validateProfilePicture(file: File): string | null {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return `Invalid file type. Only ${ALLOWED_FORMATS_TEXT} images are allowed.`;
    }

    if (file.size > MAX_FILE_SIZE) {
        return `File size exceeds ${FILE_SIZE_LIMIT_TEXT} limit.`;
    }

    return null;
}
