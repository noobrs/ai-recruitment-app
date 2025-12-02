'use client';

interface SaveCancelButtonsProps {
    onSave: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    saveLabel?: string;
    cancelLabel?: string;
}

/**
 * SaveCancelButtons Component
 * 
 * A reusable pair of save and cancel buttons.
 * Supports primary (green) and secondary (purple) variants.
 */
export default function SaveCancelButtons({
    onSave,
    onCancel,
    isLoading = false,
    disabled = false,
    variant = 'primary',
    saveLabel = 'Save',
    cancelLabel = 'Cancel'
}: SaveCancelButtonsProps) {
    const colorClass = variant === 'primary'
        ? 'bg-primary hover:bg-primary/90'
        : 'bg-secondary hover:bg-secondary/90';

    return (
        <div className="flex gap-2">
            <button
                onClick={onCancel}
                disabled={disabled || isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {cancelLabel}
            </button>
            <button
                onClick={onSave}
                disabled={disabled || isLoading}
                className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${colorClass}`}
            >
                {isLoading ? 'Saving...' : saveLabel}
            </button>
        </div>
    );
}
