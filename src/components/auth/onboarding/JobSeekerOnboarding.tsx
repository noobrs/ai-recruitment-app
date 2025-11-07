'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Mail, User, MapPin } from 'lucide-react';
import { completeOnboarding } from '@/app/auth/onboarding/actions';

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
        <div>
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
                                defaultValue={defaultLastName}
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
