'use client';

import { UserWithJobSeeker } from '@/types';
import ProfilePicture from '@/components/shared/profile/ProfilePicture';
import ProfileEditActions from '@/components/shared/profile/ProfileEditActions';
import ProfileBasicInfo from './ProfileBasicInfo';

interface ProfileHeaderProps {
    user: UserWithJobSeeker;
    isEditing: boolean;
    isSaving: boolean;
    formData: {
        first_name: string;
        last_name: string;
        location: string;
    };
    profilePicturePreview: string | null;
    onFormChange: (field: string, value: string) => void;
    onProfilePictureChange: (file: File | null, previewUrl: string | null) => void;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
}

/**
 * ProfileHeader Component
 * 
 * Responsible for orchestrating the profile header section.
 * Contains profile picture, basic info, and edit actions.
 * Single Responsibility: Profile header composition and layout.
 */
export default function ProfileHeader({
    user,
    isEditing,
    isSaving,
    formData,
    profilePicturePreview,
    onFormChange,
    onProfilePictureChange,
    onEdit,
    onCancel,
    onSave,
}: ProfileHeaderProps) {
    const getInitials = () => {
        const first = formData.first_name || user.first_name || '';
        const last = formData.last_name || user.last_name || '';
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'JS';
    };

    const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
                <ProfilePicture
                    profilePicturePath={user.profile_picture_path || undefined}
                    initials={getInitials()}
                    isEditing={isEditing}
                    previewUrl={profilePicturePreview}
                    onFileChange={onProfilePictureChange}
                />

                <ProfileBasicInfo
                    firstName={user.first_name || ''}
                    lastName={user.last_name || ''}
                    location={user.job_seeker.location || undefined}
                    memberSince={memberSince}
                    isEditing={isEditing}
                    formData={formData}
                    onFormChange={onFormChange}
                />
            </div>

            <ProfileEditActions
                isEditing={isEditing}
                isSaving={isSaving}
                onEdit={onEdit}
                onCancel={onCancel}
                onSave={onSave}
            />
        </div>
    );
}
