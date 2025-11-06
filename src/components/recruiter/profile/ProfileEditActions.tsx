'use client';

interface ProfileEditActionsProps {
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
}

/**
 * ProfileEditActions Component
 * 
 * Manages edit/save/cancel buttons for profile editing.
 */
export default function ProfileEditActions({
    isEditing,
    isSaving,
    onEdit,
    onCancel,
    onSave,
}: ProfileEditActionsProps) {
    return (
        <div className="flex gap-2">
            {!isEditing ? (
                <button
                    onClick={onEdit}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                    Edit Profile
                </button>
            ) : (
                <>
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
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </>
            )}
        </div>
    );
}
