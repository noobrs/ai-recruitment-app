'use client';

import Image from 'next/image';

interface ProfilePictureProps {
    profilePicturePath?: string;
    initials: string;
}

/**
 * ProfilePicture Component
 * 
 * Displays profile picture or initials fallback.
 */
export default function ProfilePicture({ profilePicturePath, initials }: ProfilePictureProps) {
    return (
        <div className="relative w-[120px] h-[120px]">
            {profilePicturePath ? (
                <Image
                    src={profilePicturePath}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-gray-100"
                />
            ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-gray-100">
                    <span className="text-4xl font-bold text-white">{initials}</span>
                </div>
            )}
        </div>
    );
}
