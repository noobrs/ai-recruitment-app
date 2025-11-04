'use client';

import { useState } from 'react';
// import FormContainer from '@/components/auth-old/FormContainer';
// import FormInput from '@/components/auth-old/FormInput';
// import ProgressStepper from '@/components/auth-old/ProgressStepper';
// import ProfilePictureUpload from '@/components/auth-old/ProfilePictureUpload';

interface OnboardingClientProps {
    email: string;
    defaultFirstName: string;
    defaultLastName: string;
}

export default function OnboardingClient({ email, defaultFirstName, defaultLastName }: OnboardingClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setProfilePicture] = useState<File | null>(null);

    const steps = [
        { label: 'Register', status: 'completed' as const },
        { label: 'Complete Profile', status: 'current' as const },
        { label: 'Dashboard', status: 'upcoming' as const },
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            location: formData.get('location') as string || undefined,
            aboutMe: formData.get('aboutMe') as string || undefined,
        };

        try {
            const result = { error: "Function not implemented." }; // TODO: Replace with actual onboarding action call
            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            }
            // If successful, redirect() will be called and throw NEXT_REDIRECT
        } catch (error) {
            // Check if this is a Next.js redirect (which is expected)
            if (error && typeof error === 'object' && 'digest' in error) {
                // This is a Next.js redirect - let it propagate
                throw error;
            }
            // Only show error for actual errors
            setError('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    const handleProfilePictureSelect = (file: File) => {
        setProfilePicture(file);
        // TODO: Implement upload to Supabase storage when storage is configured
        console.log('Profile picture selected:', file.name);
    };

    return (
        <div>
            Job Seeker Onboarding Client
        </div>
        // <FormContainer
        //     title="Complete Your Profile"
        //     subtitle="Welcome! Let's set up your job seeker profile"
        //     maxWidth="2xl"
        // >
        //     {/* Progress Stepper */}
        //     <ProgressStepper steps={steps} />

        //     {/* User Email Info */}
        //     <div className="text-center pb-4 border-b border-gray-200">
        //         <p className="text-sm text-gray-600">
        //             Signed in as: <span className="font-medium text-gray-900">{email}</span>
        //         </p>
        //     </div>

        //     {/* Error Message */}
        //     {error && (
        //         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        //             {error}
        //         </div>
        //     )}

        //     {/* Onboarding Form */}
        //     <form onSubmit={handleSubmit} className="space-y-6">
        //         {/* Profile Picture Upload */}
        //         <ProfilePictureUpload
        //             onImageSelect={handleProfilePictureSelect}
        //             disabled={isLoading}
        //         />

        //         {/* Name Fields */}
        //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        //             <FormInput
        //                 label="First Name"
        //                 name="firstName"
        //                 type="text"
        //                 required
        //                 defaultValue={defaultFirstName}
        //                 disabled={isLoading}
        //                 placeholder="John"
        //             />

        //             <FormInput
        //                 label="Last Name"
        //                 name="lastName"
        //                 type="text"
        //                 required
        //                 defaultValue={defaultLastName}
        //                 disabled={isLoading}
        //                 placeholder="Doe"
        //             />
        //         </div>

        //         {/* Location */}
        //         <FormInput
        //             label="Location"
        //             name="location"
        //             type="text"
        //             placeholder="e.g., New York, NY"
        //             disabled={isLoading}
        //             helperText="Where are you located?"
        //         />

        //         {/* About Me */}
        //         <FormInput
        //             label="About Me"
        //             name="aboutMe"
        //             isTextarea
        //             rows={4}
        //             placeholder="Tell us about yourself, your skills, and what you're looking for..."
        //             disabled={isLoading}
        //             helperText="This will appear on your profile"
        //         />

        //         {/* Action Buttons */}
        //         <div className="flex gap-4 pt-4">
        //             <button
        //                 type="button"
        //                 onClick={() => window.history.back()}
        //                 disabled={isLoading}
        //                 className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        //             >
        //                 Back
        //             </button>

        //             <button
        //                 type="submit"
        //                 disabled={isLoading}
        //                 className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        //             >
        //                 {isLoading ? (
        //                     <span className="flex items-center justify-center">
        //                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        //                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        //                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        //                         </svg>
        //                         Setting up your profile...
        //                     </span>
        //                 ) : (
        //                     'Complete Setup →'
        //                 )}
        //             </button>
        //         </div>

        //         {/* Required Fields Note */}
        //         <p className="text-xs text-center text-gray-500">
        //             <span className="text-red-500">*</span> Required fields
        //         </p>
        //     </form>
        // </FormContainer>
    );
}
