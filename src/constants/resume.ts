export const RESUME_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
] as const;

export const RESUME_PDF_MAX_BYTES = 20 * 1024 * 1024; // 20MB
export const RESUME_IMAGE_MAX_BYTES = 20 * 1024 * 1024; // align with PDF limit unless otherwise specified

export type ResumeAllowedMimeType = (typeof RESUME_ALLOWED_MIME_TYPES)[number];

export function isAllowedResumeMime(mime: string): mime is ResumeAllowedMimeType {
    return RESUME_ALLOWED_MIME_TYPES.includes(mime as ResumeAllowedMimeType);
}

export function getExtensionForMime(mime: string) {
    switch (mime) {
        case 'application/pdf':
            return '.pdf';
        case 'image/png':
            return '.png';
        case 'image/jpeg':
        case 'image/jpg':
            return '.jpg';
        case 'image/webp':
            return '.webp';
        default:
            return '';
    }
}
