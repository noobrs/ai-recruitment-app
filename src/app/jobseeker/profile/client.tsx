'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Resume, UserWithJobSeeker } from '@/types';
import { updateJobSeekerProfile, updateUserProfile, setProfileResume } from './actions';
import {
    ProfileHeader,
    ProfileAboutSection,
    ProfileResumeCard,
    MyActivities,
} from '@/components/jobseeker/profile';
import ResumeDropdown from '@/components/jobseeker/profile/ResumeDropdown';
import { uploadProfilePictureAction } from '@/app/actions/profile-picture.actions';
import { deleteResume } from '@/app/actions/resume.actions';
import toast from 'react-hot-toast';
import { useBookmark } from "@/hooks/useBookmark";

interface ProfileClientProps {
    user: UserWithJobSeeker;
    profileResume: Resume | null;
    allResumes: Resume[];
}

export default function ProfileClient({ user, profileResume, allResumes }: ProfileClientProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settingProfile, setSettingProfile] = useState<number | null>(null);
    const [deletingResume, setDeletingResume] = useState<number | null>(null);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [bookmarkedJobs, setBookmarkedJobs] = useState<any[]>([]);
    const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        location: user.job_seeker.location || '',
        about_me: user.job_seeker.about_me || '',
    });
    const { toggle, loadingId } = useBookmark();

    useEffect(() => {
        async function fetchActivities() {
            try {
                const res = await fetch('/api/jobseeker/profile/activities');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setBookmarkedJobs(data.bookmarkedJobs || []);
                setAppliedJobs(data.appliedJobs || []);
            } catch (error) {
                console.error('Error loading activities:', error);
            } finally {
                setActivitiesLoading(false);
            }
        }
        fetchActivities();
    }, []);

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProfilePictureChange = (file: File | null, previewUrl: string | null) => {
        setProfilePicture(file);
        setProfilePicturePreview(previewUrl);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Upload profile picture if changed
            if (profilePicture) {
                const picFormData = new FormData();
                picFormData.append('file', profilePicture);

                const uploadResult = await uploadProfilePictureAction(picFormData);

                if (uploadResult.error) {
                    throw new Error(uploadResult.error);
                }

                toast.success('Profile picture updated!');
            }

            await updateUserProfile(user.id, {
                first_name: formData.first_name,
                last_name: formData.last_name,
            });
            await updateJobSeekerProfile(user.job_seeker.job_seeker_id, {
                location: formData.location,
                about_me: formData.about_me,
            });

            setIsEditing(false);
            setProfilePicture(null);
            setProfilePicturePreview(null);
            router.refresh();
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetAsProfile = async (resumeId: number) => {
        setSettingProfile(resumeId);
        try {
            await setProfileResume(user.job_seeker.job_seeker_id, resumeId);
            toast.success('Profile resume updated successfully!');
            router.refresh();
        } catch (error) {
            toast.error('Failed to set profile resume. Please try again.');
        } finally {
            setSettingProfile(null);
        }
    };

    const handleDeleteResume = async (resumeId: number) => {
        setDeletingResume(resumeId);
        try {
            await deleteResume(resumeId);
            toast.success('Resume deleted successfully!');
            router.refresh();
        } catch (error) {
            toast.error('Failed to delete resume. Please try again.');
        } finally {
            setDeletingResume(null);
        }
    };

    const handleToggleBookmark = async (jobId: number) => {
        const result = await toggle(user.job_seeker.job_seeker_id, jobId);

        if (result.success) {
            setBookmarkedJobs((prev) =>
                result.is_bookmark
                    ? prev
                    : prev.filter((job) => job.jobId !== jobId)
            );

            setTimeout(async () => {
                const res = await fetch('/api/jobseeker/profile/activities');
                if (res.ok) {
                    const data = await res.json();
                    setBookmarkedJobs(data.bookmarkedJobs || []);
                }
            }, 300);
        }
    };


    return (
        <div data-role="jobseeker" className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <ProfileHeader
                    user={user}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    formData={formData}
                    profilePicturePreview={profilePicturePreview}
                    onFormChange={handleFormChange}
                    onProfilePictureChange={handleProfilePictureChange}
                    onEdit={() => setIsEditing(true)}
                    onCancel={() => {
                        setIsEditing(false);
                        setProfilePicture(null);
                        setProfilePicturePreview(null);
                    }}
                    onSave={handleSave}
                />
                <ProfileAboutSection
                    aboutMe={formData.about_me}
                    isEditing={isEditing}
                    value={formData.about_me}
                    onChange={v => handleFormChange('about_me', v)}
                />
            </div>

            {/* Resume Dropdown */}
            <ResumeDropdown
                resumes={allResumes}
                profileResume={profileResume}
                settingProfileId={settingProfile}
                onSetAsProfile={handleSetAsProfile}
                onDeleteResume={handleDeleteResume}
                jobSeekerId={user.job_seeker.job_seeker_id}
                deletingResumeId={deletingResume}
            />

            {/* Resume Info */}
            {profileResume && <ProfileResumeCard resume={profileResume} />}

            {/* Dynamic My Activities */}
            <MyActivities
                bookmarkedJobs={bookmarkedJobs}
                appliedJobs={appliedJobs}
                loading={activitiesLoading}
                bookmarkLoadingId={loadingId}
                onToggleBookmark={handleToggleBookmark}
            />

        </div>
    );
}
