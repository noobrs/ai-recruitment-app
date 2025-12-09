'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Mail, User, MapPin } from 'lucide-react';
import { completeOnboarding } from '@/app/auth/onboarding/actions';
import { uploadProfilePictureAction } from '@/app/actions/profile-picture.actions';
import {
    FILE_SIZE_LIMIT_TEXT,
    ALLOWED_FORMATS_TEXT
} from '@/constants/profile-picture.constants';
import ProfilePictureUpload from '@/components/shared/profile/ProfilePictureUpload';

interface JobSeekerOnboardingProps {
    userId: string;
    email: string;
    defaultFirstName: string;
    defaultLastName: string;
}

export default function JobSeekerOnboarding({
    email,
    defaultFirstName,
    defaultLastName,
}: JobSeekerOnboardingProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [firstName, setFirstName] = useState(defaultFirstName);
    const [lastName, setLastName] = useState(defaultLastName);

    // Check if all required fields are filled
    const isFormValid = firstName.trim() !== '' && lastName.trim() !== '';

    const handleProfilePictureChange = (file: File | null, preview: string | null) => {
        setProfilePicture(file);
        setPreviewUrl(preview);
    };

    // Get initials from default names
    const initials = `${defaultFirstName.charAt(0)}${defaultLastName.charAt(0)}`.toUpperCase();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            role: 'jobseeker' as const,
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            location: (formData.get('location') as string) || undefined,
            aboutMe: (formData.get('aboutMe') as string) || undefined,
        };

        try {
            // First, upload profile picture if provided
            if (profilePicture) {
                const picFormData = new FormData();
                picFormData.append('file', profilePicture);

                // Use server action instead of API route
                const uploadResult = await uploadProfilePictureAction(picFormData);

                if (uploadResult.error) {
                    throw new Error(uploadResult.error);
                }
            }

            // Complete onboarding
            const result = await completeOnboarding(data);

            if (!result.success) {
                throw new Error(result.error || 'Failed to complete onboarding');
            }

            toast.success('Profile setup complete!');
            router.push('/jobseeker/dashboard');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div data-role="jobseeker">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                    Complete Your Job Seeker Profile
                </h2>
                <p className="text-sm text-neutral-600 flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    {email}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center mb-6">
                    <ProfilePictureUpload
                        previewUrl={previewUrl}
                        initials={initials}
                        isEditing={true}
                        isSaving={isLoading}
                        onFileChange={handleProfilePictureChange}
                    />
                    <p className="mt-2 text-xs text-neutral-500 text-center">
                        Optional: Add a profile picture
                        <br />
                        ({FILE_SIZE_LIMIT_TEXT}, {ALLOWED_FORMATS_TEXT})
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-neutral-700">
                            First Name <span className="text-red-500">*</span>
                        </span>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={isLoading}
                                placeholder="John"
                                className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-neutral-700">
                            Last Name <span className="text-red-500">*</span>
                        </span>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                disabled={isLoading}
                                placeholder="Doe"
                                className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Location
                    </span>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            name="location"
                            disabled={isLoading}
                            placeholder="e.g., New York, NY"
                            className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        About Me
                    </span>
                    <textarea
                        name="aboutMe"
                        rows={4}
                        disabled={isLoading}
                        placeholder="Tell us about yourself, your skills, and what you're looking for..."
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                        This will appear on your profile
                    </p>
                </label>

                <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="w-full rounded-lg bg-neutral-900 text-white py-3 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Setting up your profile...
                        </>
                    ) : (
                        'Complete Setup'
                    )}
                </button>
            </form>
        </div>
    );
}
