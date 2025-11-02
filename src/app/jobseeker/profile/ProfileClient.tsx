'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Resume, JobSeeker } from '@/types';
import { updateJobSeekerProfile, updateUserProfile, setProfileResume } from './actions';

type UserWithJobSeeker = User & {
    job_seeker: JobSeeker;
};

interface Experience {
    title?: string;
    position?: string;
    company?: string;
    duration?: string;
    description?: string;
}

interface Education {
    degree?: string;
    qualification?: string;
    institution?: string;
    school?: string;
    year?: string;
}

interface ProfileClientProps {
    user: UserWithJobSeeker;
    profileResume: Resume | null;
    allResumes: Resume[];
}

export default function ProfileClient({ user, profileResume, allResumes }: ProfileClientProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settingProfile, setSettingProfile] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        location: user.job_seeker.location || '',
        about_me: user.job_seeker.about_me || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            window.location.reload(); // Refresh to show updated data
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
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

    const handleSetAsProfile = async (resumeId: number) => {
        setSettingProfile(resumeId);
        try {
            await setProfileResume(user.job_seeker.job_seeker_id, resumeId);
            window.location.reload(); // Refresh to show updated profile resume
        } catch (error) {
            console.error('Error setting profile resume:', error);
            alert('Failed to set profile resume. Please try again.');
        } finally {
            setSettingProfile(null);
        }
    };

    const getInitials = () => {
        const first = formData.first_name || user.first_name || '';
        const last = formData.last_name || user.last_name || '';
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'JS';
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-6">
                        {/* Profile Picture */}
                        <div className="relative">
                            {user.profile_picture_path ? (
                                <Image
                                    src={user.profile_picture_path}
                                    alt="Profile"
                                    width={120}
                                    height={120}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-[120px] h-[120px] rounded-full bg-primary flex items-center justify-center text-white text-3xl font-semibold">
                                    {getInitials()}
                                </div>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div>
                            {!isEditing ? (
                                <>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        {user.first_name} {user.last_name}
                                    </h1>
                                    {user.job_seeker.location && (
                                        <p className="text-gray-600 mb-2 flex items-center gap-2">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                            {user.job_seeker.location}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </p>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            placeholder="First Name"
                                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            placeholder="Last Name"
                                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Location (e.g., San Francisco, CA)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Button */}
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                {/* About Me Section */}
                <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">About Me</h2>
                    {!isEditing ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {user.job_seeker.about_me || 'No bio added yet. Click "Edit Profile" to add one.'}
                        </p>
                    ) : (
                        <textarea
                            value={formData.about_me}
                            onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
                            placeholder="Tell employers about yourself, your experience, and what you're looking for..."
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    )}
                </div>
            </div>

            {/* Profile Resume Section */}
            {profileResume && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Profile Resume
                    </h2>

                    {/* Resume Details */}
                    <div className="space-y-4">
                        {/* Skills */}
                        {profileResume.extracted_skills && (
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {JSON.parse(profileResume.extracted_skills).map((skill: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experience */}
                        {profileResume.extracted_experiences && (
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
                                <div className="space-y-3">
                                    {(JSON.parse(profileResume.extracted_experiences) as Experience[]).map((exp, index) => (
                                        <div key={index} className="border-l-2 border-primary pl-4">
                                            <h4 className="font-medium text-gray-900">{exp.title || exp.position}</h4>
                                            <p className="text-sm text-gray-600">{exp.company}</p>
                                            {exp.duration && (
                                                <p className="text-sm text-gray-500">{exp.duration}</p>
                                            )}
                                            {exp.description && (
                                                <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {profileResume.extracted_education && (
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Education</h3>
                                <div className="space-y-3">
                                    {(JSON.parse(profileResume.extracted_education) as Education[]).map((edu, index) => (
                                        <div key={index} className="border-l-2 border-primary pl-4">
                                            <h4 className="font-medium text-gray-900">{edu.degree || edu.qualification}</h4>
                                            <p className="text-sm text-gray-600">{edu.institution || edu.school}</p>
                                            {edu.year && (
                                                <p className="text-sm text-gray-500">{edu.year}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Uploaded on {new Date(profileResume.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            )}

            {/* All Resumes Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
                    <span className="text-sm text-gray-500">{allResumes.length} resume(s)</span>
                </div>

                {allResumes.length === 0 ? (
                    <div className="text-center py-8">
                        <svg
                            className="w-16 h-16 text-gray-300 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <p className="text-gray-500 mb-4">No resumes uploaded yet</p>
                        <a
                            href="/jobseeker/dashboard"
                            className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Upload Your First Resume
                        </a>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {allResumes.map((resume) => (
                            <div
                                key={resume.resume_id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:border-primary transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <svg
                                        className="w-10 h-10 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900">
                                                Resume {allResumes.indexOf(resume) + 1}
                                            </p>
                                            {resume.is_profile && (
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                    Profile
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Uploaded {new Date(resume.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={resume.original_file_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        View
                                    </a>
                                    {!resume.is_profile && (
                                        <button
                                            onClick={() => handleSetAsProfile(resume.resume_id)}
                                            disabled={settingProfile === resume.resume_id}
                                            className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {settingProfile === resume.resume_id ? 'Setting...' : 'Set as Profile'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
