'use client';

interface ProfileBasicInfoProps {
    firstName: string;
    lastName: string;
    location?: string;
    memberSince: string;
    isEditing: boolean;
    formData: {
        first_name: string;
        last_name: string;
        location: string;
    };
    onFormChange: (field: string, value: string) => void;
}

/**
 * ProfileBasicInfo Component
 * 
 * Responsible for displaying/editing user's basic information (name, location, member since).
 * Single Responsibility: Basic profile information display and input.
 */
export default function ProfileBasicInfo({
    firstName,
    lastName,
    location,
    memberSince,
    isEditing,
    formData,
    onFormChange,
}: ProfileBasicInfoProps) {
    if (!isEditing) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {firstName} {lastName}
                </h1>
                {location && (
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
                        {location}
                    </p>
                )}
                <p className="text-sm text-gray-500">
                    Member since {memberSince}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-3">
                <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => onFormChange('first_name', e.target.value)}
                    placeholder="First Name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => onFormChange('last_name', e.target.value)}
                    placeholder="Last Name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
            <input
                type="text"
                value={formData.location}
                onChange={(e) => onFormChange('location', e.target.value)}
                placeholder="Location (e.g., San Francisco, CA)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div>
    );
}
