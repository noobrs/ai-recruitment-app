'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Mail, User, Building2, Globe } from 'lucide-react';
import { completeOnboarding } from '@/app/auth/onboarding/actions';
import { uploadProfilePictureAction } from '@/app/actions/profile-picture.actions';
import {
    FILE_SIZE_LIMIT_TEXT,
    ALLOWED_FORMATS_TEXT
} from '@/constants/profile-picture.constants';
import ProfilePictureUpload from '@/components/shared/ProfilePictureUpload';

interface RecruiterOnboardingProps {
    userId: string;
    email: string;
    defaultFirstName: string;
    defaultLastName: string;
}

export default function RecruiterOnboarding({
    email,
    defaultFirstName,
    defaultLastName,
}: RecruiterOnboardingProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
            role: 'recruiter' as const,
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            companyName: formData.get('companyName') as string,
            companyWebsite: (formData.get('companyWebsite') as string) || undefined,
            companyIndustry: (formData.get('companyIndustry') as string) || undefined,
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
            router.push('/recruiter/dashboard');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div data-role="recruiter">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                    Complete Your Recruiter Profile
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
                                defaultValue={defaultFirstName}
                                disabled={isLoading}
                                placeholder="John"
                                className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
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
                                defaultValue={defaultLastName}
                                disabled={isLoading}
                                placeholder="Doe"
                                className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
                            />
                        </div>
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Company Name <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            name="companyName"
                            required
                            disabled={isLoading}
                            placeholder="Acme Corporation"
                            className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Company Website
                    </span>
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                            type="url"
                            name="companyWebsite"
                            disabled={isLoading}
                            placeholder="https://example.com"
                            className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Industry
                    </span>
                    <select
                        name="companyIndustry"
                        disabled={isLoading}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
                    >
                        <option value="">Select an industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-neutral-900 text-white py-3 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70 transition-opacity"
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
