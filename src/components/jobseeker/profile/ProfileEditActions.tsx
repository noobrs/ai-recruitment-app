'use client';

interface ProfileEditActionsProps {
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
}

/**
 * ProfileEditActions Component
 * 
 * Responsible for rendering edit mode action buttons.
 * Single Responsibility: Profile edit action buttons.
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
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={onEdit}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
            Edit Profile
        </button>
    );
}
