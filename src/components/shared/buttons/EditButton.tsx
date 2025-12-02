'use client';

interface EditButtonProps {
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    label?: string;
}

/**
 * EditButton Component
 * 
 * A reusable edit button component.
 * Supports primary (green) and secondary (purple) variants.
 * Used for Edit Profile and other edit actions.
 */
export default function EditButton({
    onClick,
    disabled = false,
    variant = 'primary',
    label = 'Edit'
}: EditButtonProps) {
    const bgClass = variant === 'primary'
        ? 'bg-primary hover:bg-primary/90'
        : 'bg-secondary hover:bg-secondary/90';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${bgClass}`}
        >
            {label}
        </button>
    );
}
