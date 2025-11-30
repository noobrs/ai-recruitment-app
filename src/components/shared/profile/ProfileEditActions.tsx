'use client';

import EditButton from '@/components/shared/buttons/EditButton';
import SaveCancelButtons from '@/components/shared/buttons/SaveCancelButtons';

interface ProfileEditActionsProps {
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    variant?: 'primary' | 'secondary';
}

/**
 * ProfileEditActions Component (Shared)
 * 
 * Manages edit/save/cancel buttons for profile editing.
 * Used by both jobseeker and recruiter profiles.
 * Supports primary (green) and secondary (purple) variants.
 */
export default function ProfileEditActions({
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
    variant = 'primary',
}: ProfileEditActionsProps) {
    if (isEditing) {
        return (
            <SaveCancelButtons
                onSave={onSave}
                onCancel={onCancel}
                isLoading={isSaving}
                variant={variant}
            />
        );
    }

    return (
        <EditButton
            onClick={onEdit}
            variant={variant}
            label="Edit Profile"
        />
    );
}
