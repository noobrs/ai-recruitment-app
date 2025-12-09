'use client';

import ProfilePictureUpload from './ProfilePictureUpload';

interface ProfilePictureProps {
    profilePicturePath?: string;
    initials: string;
    isEditing: boolean;
    isSaving: boolean;
    previewUrl: string | null;
    onFileChange: (file: File | null, previewUrl: string | null) => void;
}

/**
 * ProfilePicture Component
 * 
 * Shared component for displaying user's profile picture or initials fallback.
 * Shows edit overlay when isEditing is true.
 * Handles both jobseeker and recruiter profiles.
 */
export default function ProfilePicture({
    profilePicturePath,
    initials,
    isEditing,
    isSaving,
    previewUrl,
    onFileChange
}: ProfilePictureProps) {
    return (
        <ProfilePictureUpload
            currentPicturePath={profilePicturePath}
            previewUrl={previewUrl}
            initials={initials}
            isEditing={isEditing}
            isSaving={isSaving}
            onFileChange={onFileChange}
        />
    );
}
