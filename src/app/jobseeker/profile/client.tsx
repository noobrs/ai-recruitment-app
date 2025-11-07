'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Resume, UserWithJobSeeker } from '@/types';
import { updateJobSeekerProfile, updateUserProfile, setProfileResume } from './actions';
import {
    ProfileHeader,
    ProfileAboutSection,
    ProfileResumeCard,
    ResumesList,
    MyActivities,
} from '@/components/jobseeker/profile';
import { toggleBookmark } from '../jobs/actions';

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
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [bookmarkedJobs, setBookmarkedJobs] = useState<any[]>([]);
    const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        location: user.job_seeker.location || '',
        about_me: user.job_seeker.about_me || '',
    });
    const [bookmarkLoadingId, setBookmarkLoadingId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchActivities() {
            try {
                const res = await fetch('/api/auth/jobseeker/profile/activities');
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUserProfile(user.id, {
                first_name: formData.first_name,
                last_name: formData.last_name,
            });
            await updateJobSeekerProfile(user.job_seeker.job_seeker_id, {
                location: formData.location,
                about_me: formData.about_me,
            });
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetAsProfile = async (resumeId: number) => {
        setSettingProfile(resumeId);
        try {
            await setProfileResume(user.job_seeker.job_seeker_id, resumeId);
            router.refresh();
        } catch (error) {
            alert('Failed to set profile resume.');
        } finally {
            setSettingProfile(null);
        }
    };

    const handleToggleBookmark = async (jobId: number) => {
        try {
            setBookmarkLoadingId(jobId);
            setBookmarkedJobs(prev => {
                const exists = prev.some(job => job.jobId === jobId);
                if (exists) {
                    return prev.filter(job => job.jobId !== jobId);
                } else {
                    const jobToAdd = appliedJobs.find(job => job.jobId === jobId);
                    return jobToAdd ? [...prev, { ...jobToAdd, bookmark: true }] : prev;
                }
            });

            setAppliedJobs(prev =>
                prev.map(job =>
                    job.jobId === jobId ? { ...job, bookmark: !job.bookmark } : job
                )
            );

            const result = await toggleBookmark(user.job_seeker.job_seeker_id, jobId);

            if (!result.success) {
                alert('Failed to update bookmark.');
                router.refresh();
            }
        } catch (err) {
            console.error('Error toggling bookmark:', err);
            alert('Error updating bookmark.');
            router.refresh();
        } finally {
            setBookmarkLoadingId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <ProfileHeader
                    user={user}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    formData={formData}
                    onFormChange={handleFormChange}
                    onEdit={() => setIsEditing(true)}
                    onCancel={() => setIsEditing(false)}
                    onSave={handleSave}
                />
                <ProfileAboutSection
                    aboutMe={formData.about_me}
                    isEditing={isEditing}
                    value={formData.about_me}
                    onChange={v => handleFormChange('about_me', v)}
                />
            </div>

            {/* Resume Info */}
            {profileResume && <ProfileResumeCard resume={profileResume} />}

            {/* All Resumes */}
            <ResumesList
                resumes={allResumes}
                settingProfileId={settingProfile}
                onSetAsProfile={handleSetAsProfile}
            />

            {/* Dynamic My Activities */}
            <MyActivities
                bookmarkedJobs={bookmarkedJobs}
                appliedJobs={appliedJobs}
                loading={activitiesLoading}
                bookmarkLoadingId={bookmarkLoadingId}
                onToggleBookmark={handleToggleBookmark}
            />

        </div>
    );
}
