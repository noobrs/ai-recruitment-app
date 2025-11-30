'use client';

interface ProfileAboutSectionProps {
    aboutMe?: string;
    isEditing: boolean;
    isSaving?: boolean;
    value: string;
    onChange: (value: string) => void;
}

/**
 * ProfileAboutSection Component
 * 
 * Responsible for displaying/editing the "About Me" section.
 * Single Responsibility: About me text display and editing.
 */
export default function ProfileAboutSection({
    aboutMe,
    isEditing,
    isSaving = false,
    value,
    onChange,
}: ProfileAboutSectionProps) {
    return (
        <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About Me</h2>
            {!isEditing ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                    {aboutMe || 'No bio added yet. Click "Edit Profile" to add one.'}
                </p>
            ) : (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Tell employers about yourself, your experience, and what you're looking for..."
                    rows={6}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
            )}
        </div>
    );
}
