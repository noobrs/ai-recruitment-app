'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Resume, JobSeeker } from '@/types';
import { updateJobSeekerProfile, updateUserProfile, setProfileResume } from './actions';
import {
    ProfileHeader,
    ProfileAboutSection,
    ProfileResumeCard,
    ResumesList,
} from '@/components/jobseeker/profile';

type UserWithJobSeeker = User & {
    job_seeker: JobSeeker;
};

interface ProfileClientProps {
    user: UserWithJobSeeker;
    profileResume: Resume | null;
    allResumes: Resume[];
}

/**
 * ProfileClient Component (Refactored)
 * 
 * Main orchestrator component for the profile page.
 * Single Responsibility: Coordinate profile state management and delegate 
 * rendering to specialized child components.
 * 
 * Follows Single Responsibility Principle:
 * - State management (editing, saving, form data)
 * - Coordinate API calls for updates
 * - Delegate UI rendering to child components
 */

export default function ProfileClient({ user, profileResume, allResumes }: ProfileClientProps) {
    // Hooks
    const router = useRouter();

    // State Management
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settingProfile, setSettingProfile] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        location: user.job_seeker.location || '',
        about_me: user.job_seeker.about_me || '',
    });

    // Handlers
    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            location: user.job_seeker.location || '',
            about_me: user.job_seeker.about_me || '',
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Update user table (first_name, last_name)
            await updateUserProfile(user.id, {
                first_name: formData.first_name,
                last_name: formData.last_name,
            });

            // Update job_seeker table (location, about_me)
            await updateJobSeekerProfile(user.job_seeker.job_seeker_id, {
                location: formData.location,
                about_me: formData.about_me,
            });

            setIsEditing(false);
            router.refresh(); // Refresh to show updated data
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetAsProfile = async (resumeId: number) => {
        setSettingProfile(resumeId);
        try {
            await setProfileResume(user.job_seeker.job_seeker_id, resumeId);
            router.refresh(); // Refresh to show updated profile resume
        } catch (error) {
            console.error('Error setting profile resume:', error);
            alert('Failed to set profile resume. Please try again.');
        } finally {
            setSettingProfile(null);
        }
    };

    // Render: Delegate to specialized components
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Profile Header Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <ProfileHeader
                    user={user}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    formData={formData}
                    onFormChange={handleFormChange}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                    onSave={handleSave}
                />

                <ProfileAboutSection
                    aboutMe={user.job_seeker.about_me || undefined}
                    isEditing={isEditing}
                    value={formData.about_me}
                    onChange={(value) => handleFormChange('about_me', value)}
                />
            </div>

            {/* Profile Resume Card */}
            {profileResume && <ProfileResumeCard resume={profileResume} />}

            {/* All Resumes List */}
            <ResumesList
                resumes={allResumes}
                settingProfileId={settingProfile}
                onSetAsProfile={handleSetAsProfile}
            />
        </div>
    );
}
