'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithRecruiter, Job } from '@/types';
import { updateRecruiterProfile, updateUserProfile } from './actions';
import {
    ProfileHeader,
    ProfileAboutSection,
    CompanyInfoCard,
    MyJobsCard,
} from '@/components/recruiter/profile';
import { uploadProfilePictureAction } from '@/app/actions/profile-picture.actions';
import toast from 'react-hot-toast';

interface ProfileClientProps {
    user: UserWithRecruiter;
}

export default function ProfileClient({ user }: ProfileClientProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [postedJobs, setPostedJobs] = useState<Job[]>([]);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        position: user.recruiter.position || '',
    });

    // Load recruiter's posted jobs
    useEffect(() => {
        async function fetchJobs() {
            try {
                const res = await fetch('/api/recruiter/jobs');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setPostedJobs(data.jobs || []);
            } catch (err) {
                console.error('Error loading jobs:', err);
            } finally {
                setJobsLoading(false);
            }
        }
        fetchJobs();
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
            await updateRecruiterProfile(user.recruiter.recruiter_id, {
                position: formData.position,
            });

            setIsEditing(false);
            setProfilePicture(null);
            setProfilePicturePreview(null);
            router.refresh();
        } catch (err) {
            console.error('Error updating profile:', err);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
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
                    profilePicturePreview={profilePicturePreview}
                    onFormChange={handleFormChange}
                    onProfilePictureChange={handleProfilePictureChange}
                    onEdit={() => setIsEditing(true)}
                    onCancel={() => {
                        setIsEditing(false);
                        setProfilePicture(null);
                        setProfilePicturePreview(null);
                        setFormData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            position: user.recruiter.position || '',
                        });
                    }}
                    onSave={handleSave}
                />
                <ProfileAboutSection
                    position={formData.position}
                    isEditing={isEditing}
                    value={formData.position}
                    onChange={(v: string) => handleFormChange('position', v)}
                />
            </div>

            {/* Company Info */}
            {user.recruiter.company && (
                <CompanyInfoCard company={user.recruiter.company} />
            )}

            {/* Posted Jobs */}
            <MyJobsCard
                loading={jobsLoading}
                jobs={postedJobs}
                onViewJob={(jobId: number) => router.push(`/recruiter/jobs/${jobId}`)}
            />
        </div>
    );
}
