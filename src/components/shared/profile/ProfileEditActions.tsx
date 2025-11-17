'use client';

interface ProfileEditActionsProps {
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
}

/**
 * ProfileEditActions Component (Shared)
 * 
 * Manages edit/save/cancel buttons for profile editing.
 * Used by both jobseeker and recruiter profiles.
 */
export default function ProfileEditActions({
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
}: ProfileEditActionsProps) {
    if (isEditing) {
        return (
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'hsl(var(--accent))', opacity: isSaving ? 0.5 : 1 }}
                    onMouseEnter={(e) => !isSaving && (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => !isSaving && (e.currentTarget.style.opacity = '1')}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={onEdit}
            className="px-4 py-2 text-white rounded-md transition-colors"
            style={{ backgroundColor: 'hsl(var(--accent))' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
            Edit Profile
        </button>
    );
}
