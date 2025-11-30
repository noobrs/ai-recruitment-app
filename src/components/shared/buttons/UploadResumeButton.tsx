'use client';

interface UploadResumeButtonProps {
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    label?: string;
}

/**
 * UploadResumeButton Component
 * 
 * A reusable button for uploading resumes.
 * Supports primary (green) and secondary (purple) variants.
 */
export default function UploadResumeButton({
    onClick,
    disabled = false,
    variant = 'primary',
    label = 'Upload Resume'
}: UploadResumeButtonProps) {
    const bgClass = variant === 'primary'
        ? 'bg-primary hover:bg-primary/90'
        : 'bg-secondary hover:bg-secondary/90';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${bgClass}`}
        >
            {label}
        </button>
    );
}
