'use client';

import Image from 'next/image';

interface ProfilePictureProps {
    profilePicturePath?: string;
    initials: string;
}

/**
 * ProfilePicture Component
 * 
 * Responsible for displaying user's profile picture or initials fallback.
 * Single Responsibility: Profile picture display logic only.
 */
export default function ProfilePicture({ profilePicturePath, initials }: ProfilePictureProps) {
    return (
        <div className="relative">
            {profilePicturePath ? (
                <Image
                    src={profilePicturePath}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full object-cover"
                />
            ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-primary flex items-center justify-center text-white text-3xl font-semibold">
                    {initials}
                </div>
            )}
        </div>
    );
}
